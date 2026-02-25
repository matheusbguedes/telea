#!/bin/bash

# Script para fazer bump de versão em todos os arquivos necessários
# Uso: ./bump-version.sh 1.2.0

set -e

if [ -z "$1" ]; then
  echo "❌ Erro: Versão não especificada"
  echo "Uso: ./bump-version.sh <versão>"
  echo "Exemplo: ./bump-version.sh 1.2.0"
  exit 1
fi

NEW_VERSION=$1

echo "🔄 Atualizando versão para: $NEW_VERSION"

# Atualizar package.json
echo "📦 Atualizando package.json..."
sed -i '' "s/\"version\": \".*\"/\"version\": \"$NEW_VERSION\"/" package.json

# Atualizar tauri.conf.json
echo "⚙️  Atualizando tauri.conf.json..."
sed -i '' "s/\"version\": \".*\"/\"version\": \"$NEW_VERSION\"/" src-tauri/tauri.conf.json

# Atualizar Cargo.toml
echo "🦀 Atualizando Cargo.toml..."
sed -i '' "s/^version = \".*\"/version = \"$NEW_VERSION\"/" src-tauri/Cargo.toml

echo ""
echo "✅ Versão atualizada para $NEW_VERSION em todos os arquivos!"
echo ""
echo "📝 Próximos passos:"
echo "  1. Revise as mudanças: git diff"
echo "  2. Commit: git add . && git commit -m 'chore: bump version to $NEW_VERSION'"
echo "  3. Tag: git tag v$NEW_VERSION"
echo "  4. Push: git push && git push --tags"
echo ""
echo "🚀 O GitHub Actions vai criar a release automaticamente!"
