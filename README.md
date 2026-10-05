# 🌳 GeneaTrack - Sistema Integral de Árbol Genealógico & Memoria Familiar

Sistema de última generación para la preservación del linaje familiar, control cronológico de natalicios, conmemoraciones luctuosas y visualización interactiva de árbol genealógico.

Diseñado para desplegarse mediante contenedores Docker en el dominio **`cumpleaños.informaticosvenezuela.com`** (Punycode: `xn--cumpleaos-r6a.informaticosvenezuela.com`).

---

## 🚀 Características Principales

* 🌳 **Árbol Genealógico Dinámico**: Motor de visualización interactivo con zoom infinito, arrastre fluido, agrupación por niveles generacionales, tarjetas de nodo ricas en detalles y líneas de conexión de parentesco.
* 🎂 **Control de Fechas de Nacimiento**: Alertas automáticas de cumpleaños próximos (7 días, 30 días, año completo), cálculo dinámico de edad a cumplir y botón de felicitación 1-clic por WhatsApp con confeti.
* 🕊️ **Registro de Antepasados y Memoriales**: Conmemoraciones luctuosas anuales ("En Memoria"), conteo de años transcurridos y cálculo de longevidad histórica.
* 👥 **Directorio & Expediente Familiar**: Vistas en cuadrícula y tabla, búsqueda multi-criterio, filtros por rama, generación y estado vital (vivos/fallecidos).
* 💍 **Gestión de Vínculos Complejos**: Progenitores (biológicos, adoptivos, crianza), matrimonios, parejas y uniones.
* 🛡️ **Seguridad & Sesión Activa**:
  * Control de inactividad de 30 minutos con alerta visual antes del cierre de sesión.
  * Hashing seguro de contraseñas (Bcrypt).
  * Sanitización contra ataques XSS.
* 📜 **Respaldos & Estándar Internacional**:
  * Exportación/Importación JSON con sellado criptográfico Merkle Root (SHA-256).
  * Exportación estándar **GEDCOM 5.5.1** compatible con MyHeritage, Ancestry, FamilySearch y Gramps.
* 🐳 **Contenedorización Docker**: Imagen multi-etapa Alpine ligera con persistencia de SQLite y fotos en volumen (`data/`).

---

## 🛠️ Stack Tecnológico

* **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Canvas Confetti.
* **Backend API**: Node.js, Express, TypeScript, Prisma ORM, SQLite.
* **Infraestructura**: Docker, Docker Compose, Nginx Reverse Proxy.

---

## 📦 Ejecución Local (Desarrollo)

### 1. Iniciar Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```
*API disponible en: `http://localhost:4000`*

### 2. Iniciar Frontend
```bash
cd frontend
npm install
npm run dev
```
*Aplicación web en: `http://localhost:3000`*

---

## 🌐 Despliegue en Servidor de Producción (Docker)

### 1. Clonar o subir el proyecto al servidor
```bash
cd /var/www/arbol-genealogico
```

### 2. Construir y Levantar Contenedor
```bash
chmod +x deploy.sh
./deploy.sh
# o directamente:
docker compose up -d --build
```

### 3. Configurar Nginx para el Dominio
Copiar la plantilla de configuración de Nginx:
```bash
sudo cp nginx/nginx.conf /etc/nginx/sites-available/cumpleanos.informaticosvenezuela.com
sudo ln -s /etc/nginx/sites-available/cumpleanos.informaticosvenezuela.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Instalar Certificado SSL (HTTPS) con Let's Encrypt
```bash
sudo certbot --nginx -d xn--cumpleaos-r6a.informaticosvenezuela.com -d cumpleanos.informaticosvenezuela.com
```

---

## 👤 Credenciales Iniciales de Administrador

* **Usuario**: `admin`
* **Contraseña**: `admin123456`
