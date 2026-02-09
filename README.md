# BeJoby

BeJoby es un **job portal con recorrido virtual IA** donde talento y empresas se conectan con asistentes inteligentes. El sitio integra un tour por cada área de la empresa, login por email, carga de CV y parsing guiado, y un stack de IA híbrido pensado para escalar.

## ✨ Qué incluye el sitio

- Recorrido virtual por áreas con asistentes IA especializados.
- Portal dual para talento y empresas con login por email/contraseña.
- Flujo de CV: carga, parsing (texto pegado) y formulario guiado.
- Sección de IA stack: Mistral AI local y futuro escalamiento con Gemini Flash 2.5 en Vertex AI.
- Confianza y seguridad: cifrado, sesiones seguras y auditoría.

## 🚀 Tecnologías

- Next.js
- TypeScript
- Tailwind CSS
- Vercel
- Node.js

## 🌍 Entornos

- Producción → https://www.bejoby.com
- Desarrollo (dev) → https://bejoby.vercel.app

Cada push a `main` despliega en producción; la rama `dev` se publica automáticamente en el entorno de desarrollo.

## 📦 Instalación local

```bash
git clone https://github.com/erwindaza/bejoby.git
cd bejoby
npm install
npm run dev
```

## 🗺️ Estructura principal

- `src/app/page.tsx`: landing principal.
- `src/components/BejobyLanding.tsx`: UI del portal, recorrido IA y flujo de CV.
- `src/app/globals.css`: tokens visuales, fuentes y estilos base.

## 🔧 Próximos pasos sugeridos

- Conectar autenticación real y storage de CV.
- Integrar servicios IA reales para parsing y matching.
- Añadir analítica de funnel y tracking de conversión.
