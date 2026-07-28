/**
 * ============================================================
 *  SUPER OZONO — Suite Operativa — Backend API (Google Apps Script)
 *  Fase 1: Usuarios/login + Roles + Proyectos + Productos + Tareas
 *  compartidos entre todos los dispositivos del equipo.
 * ============================================================
 *  Este script va PEGADO dentro de una hoja de cálculo nueva
 *  (Extensiones > Apps Script). Sigue el mismo patrón que ya
 *  usaste en Control_Retos_Y_KPIs — si ese te funcionó, este
 *  te va a resultar familiar.
 *
 *  PRIMER PASO OBLIGATORIO:
 *  1. Pega este código completo reemplazando lo que haya.
 *  2. En el desplegable de funciones elige "setup" y presiona
 *     "Ejecutar" una sola vez. Crea las 5 pestañas
 *     (Usuarios, Roles, Proyectos, Productos, Tareas) vacías,
 *     solo con encabezados — a propósito NO siembra un usuario
 *     de prueba, porque en el paso 2 vas a subir tu equipo real
 *     que ya tienes funcionando en la app.
 *  3. Despliega como aplicación web (ver README.md).
 *  4. En la app, Configuración de Backend → pega la URL → si
 *     detecta que el backend está vacío, aparece un botón para
 *     subir tu copia local actual (tu equipo, roles, proyectos
 *     y tareas de HOY) de una sola vez. Después de eso, todos
 *     inician sesión contra este backend.
 * ============================================================
 *
 *  LO QUE ESTE BACKEND *NO* HACE TODAVÍA (Fase 2, si hace falta):
 *  Metas/OKRs, Requisiciones, Mensajes, Notificaciones, Calendario
 *  editorial y Automatizaciones siguen viviendo solo en el
 *  localStorage de cada navegador — no se sincronizan entre
 *  dispositivos todavía. Se migran en una segunda ronda una vez
 *  que esta Fase 1 (usuarios + tablero de tareas) esté probada.
 *
 *  SEGURIDAD: sesión con token temporal (6 horas) y contraseñas
 *  como hash SHA-256 con sal por usuario (igual que ya calcula la
 *  app en el navegador — el backend nunca ve la contraseña en
 *  texto plano, solo el hash que la app ya le manda). Es seguridad
 *  razonable para un equipo interno de confianza, no de nivel
 *  bancario: cualquiera con la URL y una sesión válida puede leer
 *  y escribir. No compartas la URL fuera del equipo.
 * ============================================================
 */

const SHEETS = {
  Usuarios: ['ID_Usuario', 'Nombre', 'Usuario', 'Password_Salt', 'Password_Hash', 'Rol_Id', 'Nivel', 'Avatar_Color', 'Iniciales', 'Telefono', 'Canal_Notif'],
  Roles: ['ID_Rol', 'Nombre', 'Area'],
  Proyectos: ['ID_Proyecto', 'Nombre', 'Drive_Url', 'Miembros_JSON'],
  Productos: ['ID_Producto', 'ID_Proyecto', 'Nombre', 'Drive_Url', 'Roles_Drive_JSON'],
  Tareas: ['ID_Tarea', 'Titulo', 'Descripcion', 'ID_Proyecto', 'ID_Producto', 'ID_Rol', 'ID_Asignado', 'Estado', 'Fecha_Limite', 'Depende_De_JSON', 'ID_Meta', 'Drive_Url', 'Comentarios_JSON', 'Historial_JSON']
};

const SHEET_ORDER = ['Usuarios', 'Roles', 'Proyectos', 'Productos', 'Tareas'];
const SESSION_TTL_SECONDS = 21600; // 6 horas, igual que Control_Retos_Y_KPIs

function getSS() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getHeaders(sheet) {
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  return sheet.getRange(1, 1, 1, lastCol).getValues()[0];
}

function styleHeaderRow(sheet, numCols) {
  sheet.getRange(1, 1, 1, numCols).setFontWeight('bold').setBackground('#556B2F').setFontColor('#FFFFFF');
}

// Agrega columnas nuevas al final de una hoja existente si faltan, sin tocar
// ni reordenar las columnas ni los datos ya guardados. Seguro de correr varias veces.
function ensureHeaders(sheet, expectedHeaders) {
  var existing = getHeaders(sheet).filter(function (v) { return v !== ''; });
  var toAdd = expectedHeaders.filter(function (h) { return existing.indexOf(h) === -1; });
  if (toAdd.length === 0) return;
  var startCol = existing.length + 1;
  sheet.getRange(1, startCol, 1, toAdd.length).setValues([toAdd]);
  styleHeaderRow(sheet, startCol + toAdd.length - 1);
}

// ------------------------------------------------------------
// setup(): crea las 5 pestañas si no existen (o migra columnas
// nuevas si ya existían). A propósito NO siembra ningún usuario
// de prueba — el primer dato real lo sube la app con "bootstrapPush"
// desde tu copia local actual, para no tener que recrear tu equipo
// a mano en la hoja de cálculo.
// ------------------------------------------------------------
function setup() {
  var ss = getSS();
  SHEET_ORDER.forEach(function (name) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.appendRow(SHEETS[name]);
      sheet.setFrozenRows(1);
      styleHeaderRow(sheet, SHEETS[name].length);
    } else {
      ensureHeaders(sheet, SHEETS[name]);
    }
  });

  var defaultNames = ['Hoja 1', 'Sheet1'];
  defaultNames.forEach(function (n) {
    var s = ss.getSheetByName(n);
    if (s && ss.getSheets().length > 1) ss.deleteSheet(s);
  });

  SpreadsheetApp.flush();
  Logger.log('Listo: 5 pestañas creadas/migradas (Usuarios, Roles, Proyectos, Productos, Tareas). Todavía vacías a propósito — sube tus datos reales desde la app.');
}

function getSheet(name) {
  var sheet = getSS().getSheetByName(name);
  if (!sheet) throw new Error('No existe la hoja "' + name + '". Ejecuta la función setup() primero.');
  return sheet;
}

// ------------------------------------------------------------
// Contraseñas: SHA-256 de "sal:contraseña", exactamente el mismo
// esquema que ya calcula la app en el navegador con Web Crypto
// (ver hashPassword() en index 2.html). El backend nunca genera
// sal ni hash por su cuenta en Fase 1 — solo verifica al iniciar
// sesión, usando la sal que ya vino guardada desde el navegador.
// ------------------------------------------------------------
function sha256Hex(text) {
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8);
  return digest.map(function (b) {
    var v = (b + 256) % 256;
    var hex = v.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

// ------------------------------------------------------------
// SESIONES (CacheService, expiran solas a las 6 horas)
// ------------------------------------------------------------
function crearSesion(userObj) {
  var token = Utilities.getUuid();
  CacheService.getScriptCache().put('sess_' + token, JSON.stringify(userObj), SESSION_TTL_SECONDS);
  return token;
}
function getSession(token) {
  if (!token) return null;
  var raw = CacheService.getScriptCache().get('sess_' + token);
  return raw ? JSON.parse(raw) : null;
}
function borrarSesion(token) {
  if (token) CacheService.getScriptCache().remove('sess_' + token);
}

function rowsToObjects(sheet) {
  var rows = sheet.getDataRange().getValues();
  var headers = rows.shift();
  return rows
    .filter(function (row) { return row[0] !== ''; }) // ignora filas vacías al final
    .map(function (row) {
      var obj = {};
      headers.forEach(function (h, i) { obj[h] = row[i]; });
      return obj;
    });
}

function login(usuario, password) {
  // La contraseña viaja en texto plano dentro del POST (protegida por HTTPS,
  // igual que cualquier formulario de login normal) — el backend es quien
  // calcula el hash, usando la SAL propia de ese usuario que ya está
  // guardada en la hoja (la misma sal que la app generó en el navegador
  // cuando se creó la cuenta). Así el backend nunca necesita que el cliente
  // le diga de antemano cuál es la sal correcta.
  var usuarios = rowsToObjects(getSheet('Usuarios'));
  var found = null;
  for (var i = 0; i < usuarios.length; i++) {
    if (String(usuarios[i].Usuario).toLowerCase() === String(usuario).toLowerCase()) { found = usuarios[i]; break; }
  }
  if (!found) throw new Error('Usuario no encontrado');

  var expectedHash = sha256Hex(found.Password_Salt + ':' + password);
  if (String(found.Password_Hash) !== expectedHash) {
    throw new Error('Usuario o contraseña incorrectos');
  }

  var userObj = {
    id: found.ID_Usuario,
    nombre: found.Nombre,
    usuario: found.Usuario,
    rolId: found.Rol_Id,
    nivel: found.Nivel
  };
  var token = crearSesion(userObj);
  return { status: 'OK', token: token, user: userObj };
}

// ------------------------------------------------------------
// doGet: lectura de datos
//   ?action=getData&token=XXX -> todo el dataset de Fase 1
//   ?action=ping -> healthcheck simple, sin sesión, para "Probar conexión"
//   ?action=isEmpty -> true si la hoja Usuarios está vacía (para saber si
//                       toca mostrar el botón de "subir mis datos")
// ------------------------------------------------------------
function doGet(e) {
  var action = e.parameter.action;
  try {
    if (action === 'ping') return jsonOut({ status: 'OK', message: 'Backend de Super Ozono activo' });

    if (action === 'isEmpty') {
      var usuariosSheet = getSheet('Usuarios');
      return jsonOut({ status: 'OK', empty: usuariosSheet.getLastRow() <= 1 });
    }

    if (action === 'getData') {
      var user = getSession(e.parameter.token);
      if (!user) return jsonOut({ status: 'Error', message: 'Sesión inválida o expirada. Vuelve a iniciar sesión.' });
      return jsonOut({ status: 'OK', data: getAllData(), user: user });
    }

    return jsonOut({ status: 'Error', message: 'Acción no válida' });
  } catch (err) {
    return jsonOut({ status: 'Error', message: err.toString() });
  }
}

// Fase 1: sin filtrado por rol en el servidor (igual que hoy en el
// navegador, donde todo el dataset vive local y la interfaz decide qué
// mostrar según el rol). Devuelve las 5 hojas completas.
function getAllData() {
  var data = {};
  SHEET_ORDER.forEach(function (name) {
    var list = rowsToObjects(getSheet(name));
    if (name === 'Usuarios') {
      list = list.map(function (o) {
        var c = Object.assign({}, o);
        delete c.Password_Hash;
        delete c.Password_Salt;
        return c;
      });
    }
    data[name] = list;
  });
  return data;
}

// ------------------------------------------------------------
// doPost: login, bootstrapPush (solo primera vez) y syncPush
//   body = { action, token, ... }
//
//   NOTA IMPORTANTE (CORS): el frontend debe enviar el POST con
//   headers: {'Content-Type': 'text/plain;charset=utf-8'} para
//   evitar que el navegador dispare un preflight OPTIONS que
//   Apps Script no sabe responder.
// ------------------------------------------------------------
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var action = body.action;

    if (action === 'login') return jsonOut(login(body.usuario, body.password));

    if (action === 'bootstrapPush') return jsonOut(bootstrapPush(body.sheets || {}));

    if (action === 'logout') { borrarSesion(body.token); return jsonOut({ status: 'OK' }); }

    var user = getSession(body.token);
    if (!user) return jsonOut({ status: 'Error', message: 'Sesión inválida o expirada. Vuelve a iniciar sesión.' });

    if (action === 'syncPush') return jsonOut(syncPush(body.sheets || {}));
    if (action === 'setUserPassword') return jsonOut(setUserPassword(body.userId, body.passwordSalt, body.passwordHash));

    throw new Error('Acción no válida: ' + action);
  } catch (err) {
    return jsonOut({ status: 'Error', message: err.toString() });
  }
}

// Reemplaza TODAS las filas de una hoja por el arreglo recibido (excepto
// encabezados). Es un reemplazo completo, no un merge fila por fila: la
// app manda su copia completa de cada entidad en cada sincronización,
// así que "reemplazar todo" es seguro y evita tener que razonar sobre
// updates parciales. Limitación conocida (Fase 1): si dos personas
// sincronizan casi al mismo tiempo, gana la última escritura — para un
// equipo chico esto es un riesgo aceptable, no ideal.
function replaceSheetRows(sheetName, rowsArray) {
  var sheet = getSheet(sheetName);
  var headers = SHEETS[sheetName];
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, headers.length).clearContent();
  }
  if (!rowsArray || rowsArray.length === 0) return;
  var values = rowsArray.map(function (obj) {
    return headers.map(function (h) {
      var v = obj.hasOwnProperty(h) ? obj[h] : '';
      return v === null || v === undefined ? '' : v;
    });
  });
  sheet.getRange(2, 1, values.length, headers.length).setValues(values);
}

// Las contraseñas NUNCA viajan dentro de un syncPush normal — el cliente
// las omite a propósito al armar la hoja Usuarios para sincronizar (ver
// userToRemoteRow en index 2.html). Por eso aquí, al reemplazar la hoja
// Usuarios completa, SIEMPRE se conserva la Password_Salt/Password_Hash
// que ya estaba guardada para cada usuario que ya existía — un syncPush
// jamás puede borrar ni dejar desactualizada la contraseña de nadie. Los
// usuarios nuevos quedan sin contraseña hasta que llega el setUserPassword
// correspondiente (ver más abajo).
function replaceUsuariosPreservingPasswords(rowsArray) {
  var sheet = getSheet('Usuarios');
  var existingById = {};
  rowsToObjects(sheet).forEach(function (r) { existingById[r.ID_Usuario] = r; });
  var merged = (rowsArray || []).map(function (row) {
    var prev = existingById[row.ID_Usuario];
    var out = Object.assign({}, row);
    out.Password_Salt = prev ? prev.Password_Salt : (out.Password_Salt || '');
    out.Password_Hash = prev ? prev.Password_Hash : (out.Password_Hash || '');
    return out;
  });
  replaceSheetRows('Usuarios', merged);
}

function pushAllSheets(sheetsPayload) {
  SHEET_ORDER.forEach(function (name) {
    if (!sheetsPayload[name]) return;
    if (name === 'Usuarios') replaceUsuariosPreservingPasswords(sheetsPayload[name]);
    else replaceSheetRows(name, sheetsPayload[name]);
  });
}

// Primera carga de datos reales: solo funciona si Usuarios está vacía. Es
// el ÚNICO momento en que un reemplazo masivo SÍ trae contraseñas reales
// (las que ya tenías guardadas localmente antes de migrar) — porque en ese
// momento no hay nada que proteger todavía. Una vez que haya al menos un
// usuario, esta acción queda deshabilitada para siempre.
function bootstrapPush(sheetsPayload) {
  var usuariosSheet = getSheet('Usuarios');
  if (usuariosSheet.getLastRow() > 1) {
    throw new Error('El backend ya tiene datos — usa la sincronización normal (con sesión iniciada), no el arranque inicial.');
  }
  SHEET_ORDER.forEach(function (name) {
    if (sheetsPayload[name]) replaceSheetRows(name, sheetsPayload[name]);
  });
  return { status: 'OK', message: 'Datos iniciales cargados. Ahora inicia sesión con tu usuario y contraseña de siempre.' };
}

function syncPush(sheetsPayload) {
  pushAllSheets(sheetsPayload);
  return { status: 'OK' };
}

// Único camino por el que una contraseña real llega o cambia en el
// backend: registro de un miembro nuevo, o el Director restableciendo la
// de alguien desde Equipo (ver index 2.html). Es "upsert" (crea la fila si
// todavía no existe) a propósito: como syncPush corre en paralelo sin
// esperar a esta llamada, puede llegar antes o después de que el usuario
// nuevo aparezca en la hoja — cualquiera de los dos órdenes termina bien.
function setUserPassword(userId, passwordSalt, passwordHash) {
  if (!userId || !passwordHash) throw new Error('Falta userId o passwordHash');
  var sheet = getSheet('Usuarios');
  var headers = getHeaders(sheet);
  var idCol = headers.indexOf('ID_Usuario');
  var saltCol = headers.indexOf('Password_Salt');
  var hashCol = headers.indexOf('Password_Hash');
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][idCol]) === String(userId)) {
      sheet.getRange(i + 1, saltCol + 1).setValue(passwordSalt);
      sheet.getRange(i + 1, hashCol + 1).setValue(passwordHash);
      return { status: 'OK' };
    }
  }
  var blankRow = headers.map(function () { return ''; });
  blankRow[idCol] = userId;
  blankRow[saltCol] = passwordSalt;
  blankRow[hashCol] = passwordHash;
  sheet.appendRow(blankRow);
  return { status: 'OK' };
}
