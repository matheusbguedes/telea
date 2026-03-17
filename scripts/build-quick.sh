#!/bin/bash

# Script para build rápido local (sem notarização)
# Use este para testar rapidamente mudanças no código

set -e

echo "⚡ Build Rápido Local (sem notarização)"
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

# Configurar chave de assinatura do updater (se existir)
TAURI_KEY_PATH="$HOME/.tauri/telea.key"
if [ -f "$TAURI_KEY_PATH" ]; then
    export TAURI_SIGNING_PRIVATE_KEY_PATH="$TAURI_KEY_PATH"
fi

echo -e "${BLUE}🔨 Fazendo build...${NC}"
echo ""

# Build sem notarização
npm run tauri build

echo ""
echo "======================================"
echo -e "${GREEN}✅ Build completo!${NC}"
echo ""

APP_PATH="src-tauri/target/release/bundle/macos/Telea.app"

if [ -d "$APP_PATH" ]; then
    echo -e "${BLUE}📦 App gerado em:${NC}"
    echo "   $APP_PATH"
    echo ""
    
    # Verificar assinatura
    echo -e "${BLUE}🔍 Verificando assinatura...${NC}"
    if codesign -vv "$APP_PATH" 2>&1 | grep -q "valid"; then
        echo -e "${GREEN}✅ App assinado corretamente${NC}"
    else
        echo -e "${YELLOW}⚠️  App não assinado (ok para testes locais)${NC}"
    fi
    echo ""
    
    # Abrir o app
    echo -e "${YELLOW}Abrir o app agora? (s/n)${NC}"
    read -r OPEN_APP
    
    if [ "$OPEN_APP" = "s" ] || [ "$OPEN_APP" = "S" ]; then
        echo "Abrindo..."
        open "$APP_PATH"
    fi
else
    echo -e "${RED}❌ App não encontrado em: $APP_PATH${NC}"
fi

echo ""
echo -e "${BLUE}💡 Comandos úteis:${NC}"
echo ""
echo "Build rápido:           ${GREEN}./build-quick.sh${NC}"
echo "Build com notarização:  ${GREEN}./build-local.sh${NC}"
echo "Modo desenvolvimento:   ${GREEN}npm run tauri dev${NC}"
echo ""
