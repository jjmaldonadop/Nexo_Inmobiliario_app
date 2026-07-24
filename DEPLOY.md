# Checklist de despliegue — Vercel (paso 9, sección 9 de la especificación)

Este documento cubre lo que se puede dejar preparado en el repo (`vercel.json`, variables de
entorno documentadas, scripts) y lo que requiere acceso/decisiones tuyas (cuenta de Vercel,
proveedor de base de datos, protección de acceso). Nada de esto se ejecutó — necesita
credenciales que no existen en este entorno.

---

## 0. Qué ya quedó listo en el repo

- **`vercel.json`** — framework Next.js explícito, `installCommand`/`buildCommand` estándar.
  **A propósito NO corre `prisma migrate deploy` en el build**: si cada preview deployment
  (una por cada PR/push) migrara automáticamente la base de datos de producción, dos builds en
  paralelo podrían pisarse o una preview podría alterar datos reales antes de mergear. Las
  migraciones se corren aparte, a mano o desde un paso de CI protegido (sección 4).
- **`prisma/schema.prisma`** — el `datasource` ahora tiene `url` (conexión *pooled*, la que usa
  la app en runtime) y `directUrl` (conexión directa, la que necesitan `migrate deploy` y
  `db seed`). Es el patrón estándar de Prisma + Vercel + Supabase/Neon: sin esto, las funciones
  serverless agotan el límite de conexiones de un Postgres gestionado bastante rápido.
- **`package.json`** — se agregó `"postinstall": "prisma generate"`, para que el cliente de
  Prisma se regenere automáticamente en cada `npm install` de Vercel (si falta, el build falla
  con el cliente desactualizado). Verificado localmente: `prisma generate` no requiere que
  `DATABASE_URL`/`DIRECT_URL` estén configuradas para correr.
- **`.env.example`** — documenta las dos variables (`DATABASE_URL`, `DIRECT_URL`) y de dónde
  sacar cada una en Supabase o Neon.

---

## 1. Elegir y provisionar la base de datos (Supabase o Neon)

La especificación (sección 3) deja cualquiera de los dos; el plan gratuito alcanza para uso
interno.

**Supabase:**
1. Crear un proyecto nuevo.
2. Settings → Database → Connection string:
   - Copiar el modo **Transaction** (puerto `6543`, con `?pgbouncer=true`) → `DATABASE_URL`.
   - Copiar el modo **Session** (puerto `5432`) → `DIRECT_URL`.

**Neon:**
1. Crear un proyecto nuevo.
2. Dashboard → Connection Details:
   - El endpoint por defecto (pooled) → `DATABASE_URL`.
   - El endpoint marcado "unpooled"/direct → `DIRECT_URL`.

En ambos casos, agregar `sslmode=require` a la cadena si el proveedor no lo incluye ya.

- [ ] Base de datos creada
- [ ] `DATABASE_URL` (pooled) copiada
- [ ] `DIRECT_URL` (directa) copiada

---

## 2. Crear el proyecto en Vercel

1. Importar el repositorio `jjmaldonadop/Nexo_Inmobiliario_app` en Vercel (framework se detecta
   solo como Next.js gracias a `vercel.json`).
2. Project Settings → General → Node.js Version: **20.x**.
3. Project Settings → Environment Variables, agregar (marcar Production **y** Preview):
   - `DATABASE_URL`
   - `DIRECT_URL`

   Recomendado: usar una base de datos separada para Preview (o al menos no ejecutar ahí pasos
   destructivos), para que los deployments de PRs no toquen los datos reales de Nexo Inmobiliario.

- [ ] Proyecto importado en Vercel
- [ ] Variables de entorno configuradas (Production)
- [ ] Variables de entorno configuradas (Preview, idealmente apuntando a una BD aparte)

---

## 3. Restringir el acceso (spec sección 3: "acceso restringido")

Vercel → Project Settings → Deployment Protection:

- **Password Protection** (requiere plan Pro o superior): un solo password compartido con el
  equipo de Nexo Inmobiliario.
- **Vercel Authentication con lista de correos**: restringe a las cuentas de Google/GitHub/etc.
  de dominios o correos específicos de Nexo Inmobiliario — más granular, también requiere plan
  Pro o superior.

En el plan Hobby (gratuito) solo se puede proteger *Preview* deployments, no producción — si el
plan actual es Hobby, hay que decidir si se sube a Pro antes de exponer datos financieros reales,
o si se restringe el acceso a nivel de aplicación (ej. un login propio) en una iteración futura.

- [ ] Método de protección elegido y confirmado con Nexo Inmobiliario
- [ ] Protección activada en el proyecto de Vercel

---

## 4. Migrar y sembrar la base de datos (una sola vez, antes del primer deploy)

Desde tu máquina (o un paso de CI con las credenciales de producción), **no** desde el build de
Vercel:

```bash
DATABASE_URL="<pooled>" DIRECT_URL="<directa>" npx prisma migrate deploy
DATABASE_URL="<pooled>" npx prisma db seed
```

`migrate deploy` aplica `prisma/migrations/20260724173134_init_schema` (la migración inicial
documentada en el commit de la sección 2 de este flujo). `db seed` carga el catálogo real de
zonificación POT (`prisma/seed.ts`) y la fila singleton de `ConfiguracionGlobal`.

Repetir `migrate deploy` cada vez que `prisma/schema.prisma` cambie y se generen migraciones
nuevas — antes de desplegar el código que las necesita, no después.

- [ ] `prisma migrate deploy` corrido contra la base de datos de producción
- [ ] `prisma db seed` corrido contra la base de datos de producción
- [ ] Verificado (`prisma studio` o un `SELECT` directo) que `ZonificacionPOT` tiene las 6 zonas

---

## 5. Deploy

```bash
vercel --prod
```

o simplemente hacer push/merge a la rama que Vercel tiene configurada como productiva — el
deploy automático corre `npm install` (→ `postinstall` regenera el cliente de Prisma) y
`next build`.

- [ ] Deploy de producción exitoso
- [ ] La URL de producción carga el dashboard sin errores 500 (evidencia de que
      `DATABASE_URL`/`DIRECT_URL` están bien configuradas)

---

## 6. Validación post-deploy — correr proyectos reales en paralelo con el Excel

Esto es literalmente el resto del paso 9 de la especificación: no basta con que la app cargue,
hay que confirmar que calcula lo mismo que `MF_Documento_Base.xlsx` para proyectos reales.

1. Tomar 2–3 proyectos reales que Nexo Inmobiliario ya tenga modelados en Excel.
2. Capturarlos en la app desplegada (formulario `/proyectos/nuevo`).
3. Calcular resultados y comparar VAN/TIR/ROI contra el Excel correspondiente.
4. Cualquier discrepancia que no coincida con las 10 diferencias ya documentadas en
   `MOTOR_FINANCIERO.md` (secciones 9 y 10) es un bug real del motor — no un comportamiento
   esperado — y hay que investigarla antes de que el equipo empiece a confiar en la app para
   decisiones reales.

- [ ] Proyecto real #1 capturado y comparado contra su Excel
- [ ] Proyecto real #2 capturado y comparado contra su Excel
- [ ] Proyecto real #3 capturado y comparado contra su Excel (opcional pero recomendado)
- [ ] Discrepancias encontradas, si las hay, documentadas o corregidas

---

## 7. Monitoreo y rollback

- Vercel → Deployments → Functions: logs de cada API route (`/api/proyectos`, `/api/.../calcular`,
  etc.) para diagnosticar errores 500 en producción.
- Rollback: Vercel → Deployments → click derecho en un deployment anterior → "Promote to
  Production". No requiere revertir el commit ni un nuevo build.

- [ ] Alguien del equipo sabe dónde ver los logs de funciones
- [ ] Alguien del equipo sabe cómo hacer rollback sin ayuda
