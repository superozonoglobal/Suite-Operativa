# Control_Retos_Y_KPIs — Guía de puesta en marcha (paso a paso, con detalle)

Tu hoja de cálculo ya existe en tu Google Drive, creada y lista para recibir el código:

**Control_Retos_Y_KPIs** → https://docs.google.com/spreadsheets/d/1A3sqIpVe1JnUduV3WdtHIeH3sduxgpmq5Kwhm8JgwzE/edit

Vas a hacer 4 cosas, en este orden exacto: (1) pegar el código en esa hoja, (2) ejecutar una función una sola vez para crear las pestañas, (3) publicar ese código como una URL, (4) pegar esa URL en el archivo `index.html`. Ninguno de estos pasos requiere saber programar, solo seguir los clics.

---

## PASO 1 — Pegar el backend dentro de la hoja de cálculo

1. Haz clic en el enlace de arriba para abrir la hoja **Control_Retos_Y_KPIs** en tu navegador.
2. En el menú superior de Google Sheets, haz clic en **Extensiones**.
3. En el menú que se despliega, haz clic en **Apps Script**. Se abrirá una pestaña nueva del navegador con el editor de código (fondo oscuro, título "Control_Retos_Y_KPIs" arriba).
4. Vas a ver un archivo llamado `Código.gs` con un poco de código de ejemplo (algo como `function myFunction() {}`). Haz clic dentro de esa caja de texto y selecciona todo (Ctrl+A en Windows, Cmd+A en Mac) y bórralo (tecla Suprimir/Delete).
5. Abre el archivo `Code.gs` que te entregué (con el Bloc de notas, TextEdit, o cualquier editor de texto), selecciona todo su contenido, cópialo (Ctrl+C / Cmd+C).
6. Vuelve a la pestaña del editor de Apps Script y pega (Ctrl+V / Cmd+V) dentro del área vacía.
7. Guarda los cambios: icono del disquete 💾 en la barra de herramientas del editor, o Ctrl+S / Cmd+S.

Si el guardado funcionó, no aparece ningún mensaje de error y el ícono del disquete deja de estar resaltado.

---

## PASO 2 — Crear las 3 pestañas automáticamente (Retos, Entregables, Metricas)

1. Todavía en el editor de Apps Script, busca en la barra gris de arriba (debajo de "Implementar") un menú desplegable que por defecto dice algo como `setup` o el nombre de la primera función del archivo. Si no dice "setup", haz clic en el desplegable y elige **setup** de la lista.
2. Haz clic en el botón **▷ Ejecutar** (a la izquierda del desplegable).
3. **La primera vez** aparecerá una ventana pidiendo autorización:
   - Clic en **Revisar permisos**.
   - Elige tu cuenta de Google (azcaratediego@gmail.com).
   - Verás una pantalla de advertencia que dice algo como *"Google no verificó esta app"*. Esto es normal y esperado: es tu propio script, solo tú lo vas a usar. Haz clic en **Avanzado** (abajo a la izquierda) y luego en **Ir a Control_Retos_Y_KPIs (no seguro)**.
   - Haz clic en **Permitir** en la pantalla final de permisos.
4. El script se ejecutará (verás "Ejecutando función setup..." abajo y luego "Ejecución finalizada"). Esto puede tardar unos segundos.
5. Vuelve a la pestaña de la hoja de cálculo y recárgala (F5). Ahora deberías ver 3 pestañas nuevas abajo: **Retos**, **Entregables** y **Metricas**, cada una con sus encabezados en fondo morado.

Si no ves las pestañas, revisa en el editor de Apps Script la pestaña "Ejecuciones" (ícono de reloj a la izquierda) para ver el mensaje de error exacto.

---

## PASO 3 — Publicar el backend como aplicación web (esto genera la URL que necesitas)

1. En el editor de Apps Script, botón azul **Implementar** (arriba a la derecha) > **Nueva implementación**.
2. Junto a "Tipo", haz clic en el ícono de engranaje ⚙ y elige **Aplicación web**.
3. Completa el formulario:
   - **Descripción**: escribe algo como "v1" (opcional, solo para tu referencia).
   - **Ejecutar como**: deja **Yo (azcaratediego@gmail.com)**.
   - **Quién tiene acceso**: elige **Cualquier usuario**.
4. Clic en **Implementar**.
5. Puede pedir autorización otra vez (repite el mismo proceso del Paso 2 si aparece).
6. Aparecerá una ventana con el título "Implementación actualizada" y un campo **URL de la aplicación web**. Haz clic en el ícono de copiar 📋 junto a esa URL, o selecciónala y cópiala manualmente. Se ve así: `https://script.google.com/macros/s/AKfycb.../exec`
7. Guarda esa URL en algún lugar (la vas a pegar en el Paso 4).
8. Clic en **Listo**.

**Importante:** si más adelante modificas el código `Code.gs`, esa nueva versión NO se aplica automáticamente a la URL. Debes ir a **Implementar > Gestionar implementaciones**, hacer clic en el ícono de lápiz ✎, y en "Versión" elegir **Nueva versión** > **Implementar**. La URL no cambia, pero el código sí se actualiza.

---

## PASO 4 — Conectar tu aplicación local (`index.html`) con esa URL e iniciar sesión

1. Ve a la carpeta donde guardaste los archivos que te entregué y abre `index.html` haciendo doble clic (se abrirá en tu navegador).
2. Verás la pantalla de inicio de sesión con un enlace pequeño abajo: **⚙ Configurar conexión con Apps Script**. Haz clic ahí.
3. Pega la URL que copiaste en el Paso 3, dentro del campo de texto.
4. Haz clic en **Probar conexión** para confirmar que el servidor responde, luego **Guardar**.
5. En la pantalla de login, entra con el usuario administrador que `setup()` creó automáticamente:
   - **Usuario:** `admin`
   - **Contraseña:** `admin123`
6. **Cambia esa contraseña de inmediato**: arriba a la derecha, botón **🔑 Contraseña**.

La URL de la API queda guardada en el navegador donde la configuraste. Para que tu equipo no tenga que repetir el paso 2-4 en cada computadora, edita la línea `const DEFAULT_API_URL = '';` cerca del final de `index.html`, escribe tu URL entre las comillas, guarda el archivo y comparte esa copia con el equipo — a ellos les aparecerá directo la pantalla de login.

## Usuarios y rol de administrador

La hoja ahora tiene una pestaña **Usuarios** (creada por `setup()`) con un administrador por defecto. Así es como funciona la app con varias personas:

- **Administrador**: ve y edita los retos, entregables y métricas de todo el equipo; aprueba o rechaza entregables (cambia su Estado a "Aprobado"/"Con Cambios" directamente desde la tabla); es el único que puede eliminar registros; y gestiona usuarios desde la pestaña **Usuarios** (crear, editar, desactivar o eliminar).
- **Miembro**: al iniciar sesión ve y registra únicamente sus propios retos, entregables y métricas (el campo "Miembro" se autocompleta con su nombre y no se puede cambiar). Puede editar sus propios registros pero no eliminarlos, y no puede cambiar el estado de aprobación de sus entregables — eso lo decide el admin.

Para dar de alta a cada persona de tu equipo: inicia sesión como admin, ve a la pestaña **Usuarios**, y crea un usuario por cada miembro (Nombre completo, Usuario de acceso, Contraseña, Rol = Miembro). El "Nombre completo" que pongas ahí es el mismo que va a aparecer en sus Retos/Entregables/Métricas.

Cada persona abre el mismo `index.html` (o la misma URL si lo alojas en un dominio, ver más abajo) e inicia sesión con su propio usuario y contraseña.

---

## Novedades: Retos/Objetivos (OKR) y más gráficos de KPIs

A pedido tuyo, la pestaña "Retos" ahora es **"Retos y Objetivos"** y soporta el modelo que compartiste (metas trimestrales tipo OKR + retos diarios/semanales/mensuales, todo en la misma tabla):

- **Tipo** ahora incluye "Trimestral (Objetivo/OKR)" además de Diario/Semanal/Mensual.
- **Meta_Numerica**: el resultado clave cuantificable (ej. "90% de aceptación sin cambios mayores", "Reducir a 3 días hábiles por video").
- **Tareas_Clave**: las tareas semanales asociadas a ese objetivo, en texto libre (una por línea).
- **Estado** ahora incluye "En Pausa" además de Pendiente/En Progreso/Completado.
- El campo KPI y el de Métricas tienen sugerencias precargadas (ROMI, Tasa de Conversión, Engagement Rate, On-Time Delivery, y los KPIs específicos de Diseño/Video/Estrategia que detallaste) — aparecen al escribir, pero se puede escribir cualquier otro texto libre.

Si ya habías ejecutado `setup()` antes con la versión anterior, **vuelve a pegar este Code.gs y ejecuta `setup()` de nuevo**: es seguro, nunca borra datos existentes, solo agrega las columnas y la hoja "Usuarios" que falten.

El Dashboard pasó de 2 a 8 gráficos para seguimiento de rendimiento:

1. Retos/Objetivos por Estado (dona)
2. Retos/Objetivos por Miembro (barras)
3. Entregables por Estado (dona)
4. Entregables por Tipo — Pieza Gráfica vs. Video (dona)
5. Cumplimiento % por Miembro (barras)
6. Meta vs. Resultado por KPI — compara el valor esperado contra el real de cada indicador que registren (barras agrupadas)
7. Evolución del cumplimiento en el tiempo (línea)
8. Cumplimiento promedio por Área: Diseño / Video / Estrategia (solo visible para el admin, usa el campo "Área" de cada usuario)

## Qué incluye esta versión (mejoras sobre el diseño original que me compartiste)

- CRUD completo: crear, editar y eliminar registros en las 3 hojas (el diseño original solo permitía agregar).
- Se evita el bloqueo de CORS que suele romper los `POST` hacia Apps Script.
- Dashboard con tarjetas de KPIs y 2 gráficos (Retos por estado, Cumplimiento % por miembro) con datos reales.
- Tablas de Entregables y Métricas visibles en la interfaz (el diseño original solo mostraba Retos).
- Filtro por miembro y por estado en la tabla de Retos.
- Enlaces de Drive en Entregables abren en pestaña nueva.
- Cumplimiento_Porcentaje se calcula automáticamente (Valor_Real / Valor_Esperado × 100).
- Configuración de la URL de la API desde la propia interfaz (sin editar código), con botón "Probar conexión".

## Nota de seguridad

El backend de Apps Script sigue desplegado con "Cualquier usuario" (es el único modo que funciona sin alojar la app en un dominio con HTTPS propio), pero ahora **nada se lee ni se escribe sin iniciar sesión**: cada acción exige un token de sesión válido (dura 6 horas) y el servidor valida permisos por rol en cada llamada, no solo en el frontend. Las contraseñas se guardan como hash SHA-256, nunca en texto plano. Es una seguridad razonable para un equipo interno de confianza, no de nivel bancario — no compartas la URL de la API fuera del equipo.

## ¿Dónde alojar la app? (local vs. dominio propio)

Tienes dos formas de usar `index.html`:

1. **Local (como está ahora):** cada persona guarda el archivo en su computadora y lo abre con doble clic. Funciona perfecto, pero si luego editas el archivo (por ejemplo, para corregir algo), tienes que volver a repartirlo a todo el equipo.
2. **Alojado en un dominio/URL pública (recomendado para un equipo):** subes el mismo `index.html` a un hosting gratuito de archivos estáticos. Todos entran a la misma URL, inician sesión con su usuario, y si tú actualizas el archivo, se actualiza para todos automáticamente. No cambia nada del backend (sigue siendo el mismo Apps Script) — solo cambia dónde vive el HTML.

Opciones gratuitas más simples, de más a menos fácil:

- **Netlify Drop** (netlify.com/drop): arrastras el archivo `index.html` a la página y en segundos te da una URL pública. No requiere cuenta ni saber programar.
- **GitHub Pages**: si ya usas GitHub, subes el archivo a un repositorio y activas Pages en la configuración. Gratis, con tu propio subdominio.
- **Vercel**: similar a Netlify, requiere cuenta gratuita.

En cualquiera de las tres, antes de subir el archivo, completa `const DEFAULT_API_URL = '...'` con tu URL de Apps Script para que nadie tenga que configurarla. Dime si quieres que preparemos el despliegue en alguna de estas opciones y te guío paso a paso.
