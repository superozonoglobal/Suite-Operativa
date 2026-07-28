# Super Ozono — Backend Fase 1 (paso a paso)

Esto conecta tu app — ya en línea en **https://superozono.dgazcarate.online** — a una hoja de Google Sheets compartida, para que Usuarios, Roles, Proyectos, Productos y Tareas se vean iguales desde cualquier computadora del equipo, no solo desde la tuya.

**Lo que esta Fase 1 sincroniza:** Usuarios (login), Roles, Proyectos, Productos, Tareas (el tablero).
**Lo que todavía NO sincroniza (sigue solo en tu navegador, Fase 2 si hace falta):** Metas/OKR, Requisiciones, Mensajes, Notificaciones, Calendario editorial, Automatizaciones.

Vas a hacer 5 cosas, en este orden exacto:

---

## PASO 1 — Crear la hoja de cálculo y pegar el backend

1. Ve a [sheets.google.com](https://sheets.google.com) y crea una hoja de cálculo nueva en blanco. Ponle de nombre **Super_Ozono_Backend**.
2. Menú **Extensiones** → **Apps Script**. Se abre una pestaña nueva con el editor de código.
3. Verás un archivo `Código.gs` con código de ejemplo. Selecciona todo (Ctrl+A / Cmd+A) y bórralo.
4. Abre el archivo `Code.gs` que te entregué (el que está en esta misma carpeta, junto a este README), selecciona todo su contenido y cópialo.
5. Pégalo en el editor de Apps Script, en el área vacía.
6. Guarda: icono del disquete 💾 o Ctrl+S / Cmd+S.

---

## PASO 2 — Crear las 5 pestañas (vacías, a propósito)

1. En la barra gris de arriba del editor, junto al botón ▷ Ejecutar, busca el desplegable de funciones y elige **setup**.
2. Clic en **▷ Ejecutar**.
3. La primera vez va a pedir autorización:
   - **Revisar permisos** → elige tu cuenta de Google (azcaratediego@gmail.com).
   - Pantalla de advertencia "Google no verificó esta app" — es normal, es tu propio script. Clic en **Avanzado** → **Ir a Super_Ozono_Backend (no seguro)** → **Permitir**.
4. Espera a que diga "Ejecución finalizada". Vuelve a la hoja de cálculo y recárgala (F5): deberías ver 5 pestañas nuevas — **Usuarios, Roles, Proyectos, Productos, Tareas** — todas vacías, solo con encabezados en fondo verde oscuro.

**A propósito no hay ningún usuario de prueba todavía.** En el Paso 4 subes tu equipo, roles, proyectos y tareas reales de un solo golpe — no hay que recrear a nadie a mano en la hoja.

---

## PASO 3 — Publicar como aplicación web (esto genera la URL)

1. Botón azul **Implementar** (arriba a la derecha) → **Nueva implementación**.
2. Ícono de engranaje ⚙ junto a "Tipo" → **Aplicación web**.
3. Completa:
   - **Descripción**: "v1" (opcional).
   - **Ejecutar como**: **Yo (azcaratediego@gmail.com)**.
   - **Quién tiene acceso**: **Cualquier usuario**.
4. Clic en **Implementar**. Puede pedir autorización otra vez — repite el Paso 2.
5. Copia la **URL de la aplicación web** (se ve así: `https://script.google.com/macros/s/AKfycb.../exec`). La necesitas en el Paso 4.
6. Clic en **Listo**.

**Importante:** si más adelante modificas `Code.gs` (por ejemplo, si te mando una actualización), esa nueva versión NO se aplica sola. Debes ir a **Implementar → Gestionar implementaciones** → ícono de lápiz ✎ → en "Versión" elige **Nueva versión** → **Implementar**. La URL no cambia, el código sí se actualiza.

---

## PASO 4 — Conectar la app y subir tu copia actual (una sola vez)

Tu app ya está en línea en **https://superozono.dgazcarate.online** — usa esa URL en vez de abrir el archivo local.

1. Entra a **https://superozono.dgazcarate.online** e inicia sesión como siempre haces hoy (local, con tu usuario y contraseña de ese navegador).
2. Ve a **Configuración** (en el menú lateral) → sección **Backend (Fase 1)**, abajo del todo.
3. Pega la URL que copiaste en el Paso 3 (la de Apps Script, `https://script.google.com/macros/s/.../exec`), en el campo de texto.
4. Clic en **Probar conexión**. Debería decir "Conexión exitosa" y detectar que el backend está vacío.
5. Aparece un botón **Subir mis datos actuales al backend** — Clic ahí. Esto sube TODO tu equipo, roles, proyectos y tareas de hoy, tal como están en ese navegador, como los datos iniciales del backend compartido. Solo se puede hacer una vez (el propio servidor lo bloquea después).
6. Clic en **Guardar** para que la URL quede configurada en ese navegador.
7. **Cierra sesión** (botón de salir) y **vuelve a entrar** con tu mismo usuario y contraseña de siempre — esta vez va a iniciar sesión contra el backend, no localmente.

**Para que tu equipo no tenga que repetir los pasos 2-6:** pásame la URL de Apps Script que copiaste en el Paso 3 y te dejo `DEFAULT_API_URL` ya escrito dentro de `index.html`, para volver a subirlo a Hostinger — así, a cualquiera que entre a `superozono.dgazcarate.online` le aparece la conexión ya configurada. Solo tienen que iniciar sesión con su usuario y contraseña de siempre (los mismos que ya tenían localmente, porque quedaron incluidos en tu copia subida en el punto 5).

*(Nota: si prefieres no tocarlo por código, cada persona puede simplemente pegar la URL ella misma en Configuración → Backend, igual que tú.)*

---

## PASO 5 — Verificar que quedó sincronizando

1. Abre **https://superozono.dgazcarate.online** en OTRO navegador (o en modo incógnito) y entra con tu usuario.
2. Deberías ver el mismo equipo, los mismos proyectos y las mismas tareas que en tu navegador principal.
3. Crea o mueve una tarea en un lado. Espera unos 20 segundos y refresca (o simplemente espera — la app revisa cambios cada 20 segundos sola). Debería aparecer en el otro navegador.

---

## Cómo se manejan las contraseñas (para que entiendas qué tan seguro es esto)

- Las contraseñas nunca se guardan en texto plano — se guardan como hash SHA-256 con una sal por usuario, calculado por tu propio navegador (Web Crypto), exactamente igual que ya funcionaba localmente.
- El backend nunca *envía* contraseñas de vuelta a la app (ni siquiera al Director) — solo las recibe para verificarlas al iniciar sesión.
- Cada sesión dura 6 horas y después hay que volver a iniciar sesión.
- Es seguridad razonable para un equipo interno de confianza, **no de nivel bancario** — cualquiera con la URL y una sesión válida puede leer y escribir datos. No compartas la URL fuera del equipo, igual que con Control_Retos_Y_KPIs.

## Limitaciones conocidas de esta Fase 1 (para que no te tomen por sorpresa)

- **No es tiempo real.** La app revisa cambios cada ~20 segundos (Apps Script no tiene "push" real). Si necesitas ver un cambio al instante, hay que refrescar.
- **Última escritura gana.** Si dos personas cambian datos casi al mismo tiempo, la sincronización que llega después puede pisar a la anterior. Para un equipo chico (10 personas) el riesgo real es bajo, pero no es cero.
- **Metas, Requisiciones, Mensajes, Notificaciones, Calendario editorial y Automatizaciones siguen siendo solo locales** — cada quien las ve solo en su propio navegador, igual que antes de este backend. Si esto se vuelve un problema en la práctica, es la Fase 2.
- **Google Sheets no es una base de datos de verdad.** Funciona muy bien para un equipo de 10-15 personas y unas pocas decenas de tareas activas. Si Super Ozono crece mucho más, en algún momento conviene migrar a algo como Firebase o Supabase — lo hablamos si llega ese momento.
