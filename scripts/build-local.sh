#!/bin/bash

# Script para fazer build e notarização local do Telea
# Simula exatamente o que o CI/CD faz, mas rodando na sua máquina

set -e

echo "🏗️  Build e Notarização Local do Telea"
echo "======================================"
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Verificar se estamos no diretório correto
if [ ! -f "src-tauri/tauri.conf.json" ]; then
    echo -e "${RED}❌ Execute este script na raiz do projeto!${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Este script vai:${NC}"
echo "1. Fazer build do app (release mode)"
echo "2. Assinar o app com seu certificado Developer ID"
echo "3. Notarizar com a Apple (opcional)"
echo "4. Criar instalador .dmg"
echo ""

# Verificar se as credenciais da Apple estão disponíveis
echo -e "${YELLOW}Você quer notarizar o app com a Apple? (s/n)${NC}"
read -r NOTARIZE

if [ "$NOTARIZE" = "s" ] || [ "$NOTARIZE" = "S" ]; then
    echo ""
    echo -e "${BLUE}Para notarização, você precisa:${NC}"
    echo ""
    
    echo -e "${YELLOW}Digite seu Apple ID (email):${NC}"
    read -r APPLE_ID
    
    echo -e "${YELLOW}Digite a senha específica de app:${NC}"
    echo "(Gerada em: https://appleid.apple.com/account/manage)"
    read -s APPLE_PASSWORD
    echo ""
    
    APPLE_TEAM_ID="49D5C7N239"
    
    echo -e "${GREEN}✅ Credenciais configuradas${NC}"
    echo ""
    
    # Exportar variáveis de ambiente para notarização
    export APPLE_ID="$APPLE_ID"
    export APPLE_PASSWORD="$APPLE_PASSWORD"
    export APPLE_TEAM_ID="$APPLE_TEAM_ID"
fi

# Verificar chave de assinatura do updater
echo -e "${BLUE}Configurando chave de assinatura do updater...${NC}"
TAURI_KEY_PATH="$HOME/.tauri/telea.key"

if [ -f "$TAURI_KEY_PATH" ]; then
    export TAURI_SIGNING_PRIVATE_KEY_PATH="$TAURI_KEY_PATH"
    echo -e "${GREEN}✅ Chave encontrada: $TAURI_KEY_PATH${NC}"
else
    echo -e "${YELLOW}⚠️  Chave de assinatura não encontrada em: $TAURI_KEY_PATH${NC}"
    echo "O updater não funcionará sem a chave, mas o build continuará."
fi
echo ""

# Limpar builds anteriores
echo -e "${BLUE}🧹 Limpando builds anteriores...${NC}"
rm -rf src-tauri/target/release/bundle
echo -e "${GREEN}✅ Limpo${NC}"
echo ""

# Fazer build
echo -e "${BLUE}🔨 Fazendo build do app...${NC}"
echo "Isso pode levar alguns minutos..."
echo ""

if npm run tauri build -- --verbose; then
    echo ""
    echo -e "${GREEN}✅ Build concluído com sucesso!${NC}"
else
    echo ""
    echo -e "${RED}❌ Falha no build${NC}"
    exit 1
fi

echo ""
echo "======================================"
echo -e "${GREEN}✅ BUILD LOCAL COMPLETO!${NC}"
echo ""

# Mostrar onde estão os arquivos
echo -e "${BLUE}📦 Arquivos gerados:${NC}"
echo ""

APP_PATH="src-tauri/target/release/bundle/macos/Telea.app"
DMG_PATH="src-tauri/target/release/bundle/dmg/Telea_"*".dmg"

if [ -d "$APP_PATH" ]; then
    echo -e "${GREEN}✅ App:${NC}"
    ls -lh "$APP_PATH"
    echo "   Localização: $(pwd)/$APP_PATH"
    echo ""
fi

if ls $DMG_PATH 1> /dev/null 2>&1; then
    echo -e "${GREEN}✅ Instalador DMG:${NC}"
    ls -lh $DMG_PATH
    echo ""
fi

# Verificar assinatura
echo -e "${BLUE}🔍 Verificando assinatura do app...${NC}"
if codesign -vv --deep --strict "$APP_PATH" 2>&1; then
    echo -e "${GREEN}✅ App assinado corretamente${NC}"
else
    echo -e "${YELLOW}⚠️  Problema na verificação da assinatura${NC}"
fi
echo ""

# Verificar notarização (se foi feita)
if [ "$NOTARIZE" = "s" ] || [ "$NOTARIZE" = "S" ]; then
    echo -e "${BLUE}🔍 Verificando notarização...${NC}"
    if spctl -a -vv "$APP_PATH" 2>&1 | grep -q "accepted"; then
        echo -e "${GREEN}✅ App notarizado e aceito pelo Gatekeeper${NC}"
    else
        echo -e "${YELLOW}⚠️  App não está notarizado ou Gatekeeper não o aceitou${NC}"
        echo "Isso é normal se a notarização ainda está em processamento."
    fi
    echo ""
fi

echo "======================================"
echo -e "${GREEN}🚀 Como testar o app:${NC}"
echo ""
echo "1. Abrir o app diretamente:"
echo "   ${BLUE}open $APP_PATH${NC}"
echo ""
echo "2. Ou instalar via DMG:"
echo "   ${BLUE}open $DMG_PATH${NC}"
echo ""
echo "3. Verificar logs do app:"
echo "   ${BLUE}Console.app${NC} → Filtrar por 'Telea'"
echo ""

# Perguntar se quer abrir o app
echo -e "${YELLOW}Quer abrir o app agora? (s/n)${NC}"
read -r OPEN_APP

if [ "$OPEN_APP" = "s" ] || [ "$OPEN_APP" = "S" ]; then
    echo ""
    echo "Abrindo $APP_PATH..."
    open "$APP_PATH"
fi

echo ""
echo -e "${BLUE}💡 Dicas:${NC}"
echo ""
echo "- Se o macOS bloquear o app, vá em:"
echo "  Preferências do Sistema → Privacidade e Segurança"
echo ""
echo "- Para ver logs detalhados:"
echo "  Console.app → Filtrar por 'Telea' ou 'tauri'"
echo ""
echo "- Para fazer novo build:"
echo "  ${GREEN}./build-local.sh${NC}"
echo ""
