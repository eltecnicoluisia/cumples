#!/bin/bash
# ==============================================================================
# 🚀 GeneaTrack - Script de Despliegue Automatizado para Servidor Linux
# Dominio: cumpleaños.informaticosvenezuela.com
# ==============================================================================

set -e

echo "=========================================================="
echo "🌳 Iniciando Despliegue de GeneaTrack en Producción"
echo "🌐 Dominio: cumpleaños.informaticosvenezuela.com"
echo "=========================================================="

# 1. Verificar Docker y Docker Compose
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker no está instalado en este servidor."
    echo "Instálalo ejecutando: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

# 2. Crear carpetas de datos persistentes
mkdir -p data/uploads

# 3. Construir y levantar contenedores
echo "📦 Construyendo imagen Docker multi-etapa..."
docker compose build

echo "🚀 Iniciando contenedor en segundo plano..."
docker compose up -d

# 4. Verificar salud del servicio
echo "⏳ Esperando confirmación de arranque del contenedor..."
sleep 5

docker ps --filter "name=geneatrack_app"

echo ""
echo "=========================================================="
echo "✅ ¡Contenedor desplegado exitosamente en el puerto 4000!"
echo ""
echo "📌 Para conectar tu dominio:"
echo "1. Agrega el registro DNS 'A' o 'CNAME' en tu panel de DNS:"
echo "   Host / Subdominio: xn--cumpleaos-r6a (o cumpleaños) -> IP de tu servidor"
echo ""
echo "2. Copia la configuración de Nginx:"
echo "   sudo cp nginx/nginx.conf /etc/nginx/sites-available/cumpleanos.informaticosvenezuela.com"
echo "   sudo ln -s /etc/nginx/sites-available/cumpleanos.informaticosvenezuela.com /etc/nginx/sites-enabled/"
echo "   sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo "3. Genera el certificado SSL gratis con Let's Encrypt / Certbot:"
echo "   sudo certbot --nginx -d xn--cumpleaos-r6a.informaticosvenezuela.com -d cumpleanos.informaticosvenezuela.com"
echo "=========================================================="
