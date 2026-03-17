#!/bin/bash

# Script para diagnosticar problemas de assinatura e notarização
# Verifica em detalhes o que pode estar errado

set -e

echo "🔍 Diagnóstico de Assinatura e Notarização"
echo "=========================================="
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

APP_PATH="src-tauri/target/release/bundle/macos/Telea.app"

if [ ! -d "$APP_PATH" ]; then
    echo -e "${RED}❌ App não encontrado: $APP_PATH${NC}"
    echo "Execute primeiro: ./build-quick.sh"
    exit 1
fi

echo -e "${BLUE}📦 Verificando app: $APP_PATH${NC}"
echo ""

# 1. Verificar assinatura básica
echo -e "${YELLOW}1️⃣ Verificação básica de assinatura${NC}"
if codesign -vv "$APP_PATH" 2>&1; then
    echo -e "${GREEN}✅ Assinatura básica válida${NC}"
else
    echo -e "${RED}❌ Assinatura básica inválida${NC}"
fi
echo ""

# 2. Verificar assinatura profunda (deep)
echo -e "${YELLOW}2️⃣ Verificação profunda (todas as bibliotecas)${NC}"
if codesign -vv --deep --strict "$APP_PATH" 2>&1; then
    echo -e "${GREEN}✅ Assinatura profunda válida${NC}"
else
    echo -e "${RED}❌ Assinatura profunda inválida${NC}"
    echo "Algum componente interno não está assinado corretamente"
fi
echo ""

# 3. Mostrar informações da assinatura
echo -e "${YELLOW}3️⃣ Informações da assinatura${NC}"
codesign -dvv "$APP_PATH" 2>&1 | head -20
echo ""

# 4. Verificar entitlements
echo -e "${YELLOW}4️⃣ Entitlements aplicados${NC}"
codesign -d --entitlements - "$APP_PATH" 2>&1
echo ""

# 5. Verificar hardened runtime
echo -e "${YELLOW}5️⃣ Hardened Runtime${NC}"
if codesign -dvv "$APP_PATH" 2>&1 | grep -q "runtime"; then
    echo -e "${GREEN}✅ Hardened Runtime está habilitado${NC}"
else
    echo -e "${RED}❌ Hardened Runtime NÃO está habilitado${NC}"
    echo "   Necessário para notarização!"
fi
echo ""

# 6. Verificar timestamp
echo -e "${YELLOW}6️⃣ Timestamp${NC}"
if codesign -dvv "$APP_PATH" 2>&1 | grep -q "Timestamp"; then
    echo -e "${GREEN}✅ Assinatura tem timestamp${NC}"
    codesign -dvv "$APP_PATH" 2>&1 | grep "Timestamp"
else
    echo -e "${RED}❌ Assinatura SEM timestamp${NC}"
    echo "   Necessário para notarização!"
fi
echo ""

# 7. Verificar binário principal
echo -e "${YELLOW}7️⃣ Verificando binário principal${NC}"
BINARY_PATH="$APP_PATH/Contents/MacOS/telea"
if [ -f "$BINARY_PATH" ]; then
    echo "Verificando: $BINARY_PATH"
    if codesign -vv "$BINARY_PATH" 2>&1; then
        echo -e "${GREEN}✅ Binário principal assinado corretamente${NC}"
    else
        echo -e "${RED}❌ Binário principal com problema na assinatura${NC}"
    fi
    
    echo ""
    echo "Informações do binário:"
    codesign -dvv "$BINARY_PATH" 2>&1 | head -15
else
    echo -e "${RED}❌ Binário não encontrado${NC}"
fi
echo ""

# 8. Verificar todas as bibliotecas internas
echo -e "${YELLOW}8️⃣ Verificando bibliotecas internas${NC}"
FRAMEWORKS_DIR="$APP_PATH/Contents/Frameworks"
if [ -d "$FRAMEWORKS_DIR" ]; then
    echo "Frameworks encontrados:"
    ls -la "$FRAMEWORKS_DIR" 2>/dev/null | grep -v "^d" || echo "Nenhum framework"
    echo ""
    
    for framework in "$FRAMEWORKS_DIR"/*.framework "$FRAMEWORKS_DIR"/*.dylib; do
        if [ -e "$framework" ]; then
            echo "Verificando: $(basename "$framework")"
            if codesign -vv "$framework" 2>&1 | grep -q "valid"; then
                echo -e "${GREEN}✅ $(basename "$framework")${NC}"
            else
                echo -e "${RED}❌ $(basename "$framework") - NÃO ASSINADO${NC}"
            fi
        fi
    done
else
    echo "Nenhum framework encontrado"
fi
echo ""

# 9. Verificar com spctl (Gatekeeper)
echo -e "${YELLOW}9️⃣ Verificação do Gatekeeper${NC}"
if spctl -a -vv "$APP_PATH" 2>&1; then
    echo -e "${GREEN}✅ App aceito pelo Gatekeeper${NC}"
else
    echo -e "${RED}❌ App rejeitado pelo Gatekeeper${NC}"
    echo "   O app pode ser bloqueado ao abrir"
fi
echo ""

# 10. Resumo e recomendações
echo "=========================================="
echo -e "${BLUE}📋 Resumo e Recomendações${NC}"
echo ""

# Verificar se todos os checks passaram
PASSED=0
FAILED=0

if codesign -vv --deep --strict "$APP_PATH" 2>&1 >/dev/null; then
    ((PASSED++))
else
    ((FAILED++))
    echo -e "${RED}❌ Assinatura profunda falhou${NC}"
    echo "   Solução: Verificar se todas as bibliotecas estão assinadas"
    echo ""
fi

if codesign -dvv "$APP_PATH" 2>&1 | grep -q "runtime"; then
    ((PASSED++))
else
    ((FAILED++))
    echo -e "${RED}❌ Hardened Runtime não está habilitado${NC}"
    echo "   Solução: Adicionar --options runtime ao codesign"
    echo "   Tauri deve fazer isso automaticamente"
    echo ""
fi

if codesign -dvv "$APP_PATH" 2>&1 | grep -q "Timestamp"; then
    ((PASSED++))
else
    ((FAILED++))
    echo -e "${RED}❌ Timestamp não está presente${NC}"
    echo "   Solução: Adicionar --timestamp ao codesign"
    echo ""
fi

echo "=========================================="
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ Todos os checks passaram!${NC}"
    echo ""
    echo "O app deve ser aceito para notarização."
    echo ""
    echo "Para notarizar:"
    echo "  ./build-local.sh"
else
    echo -e "${YELLOW}⚠️  $FAILED problema(s) encontrado(s)${NC}"
    echo ""
    echo "Corrija os problemas acima e faça novo build."
    echo ""
    echo "Comandos úteis:"
    echo "  ./build-quick.sh     # Novo build"
    echo "  ./verify-signature.sh # Verificar novamente"
fi
echo ""
