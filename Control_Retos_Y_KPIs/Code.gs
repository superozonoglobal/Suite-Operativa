/**
 * ============================================================
 *  Control_Retos_Y_KPIs — Backend API (Google Apps Script)
 *  Login por usuario + rol Administrador + Objetivos/OKRs + KPIs
 * ============================================================
 *  Este script va PEGADO dentro de la hoja de cálculo
 *  "Control_Retos_Y_KPIs" (Extensiones > Apps Script).
 *
 *  PRIMER PASO OBLIGATORIO (o si ya lo hiciste antes, vuelve a
 *  ejecutarlo: es seguro, nunca borra datos existentes):
 *  1. Pega este código completo reemplazando lo que haya.
 *  2. En el desplegable de funciones elige "setup" y presiona
 *     "Ejecutar" una sola vez. Esto crea las 4 pestañas
 *     (Retos, Entregables, Metricas, Usuarios), agrega columnas
 *     nuevas si faltan, y siembra un usuario administrador:
 *       Usuario:    admin
 *       Contraseña: admin123
 *     CÁMBIALA apenas entres a la app (menú "Cambiar contraseña").
 *  3. Luego despliega como aplicación web (ver README.md).
 * ============================================================
 */

// Estructura de columnas por hoja (la primera columna siempre es
// el ID único). Si agregas columnas aquí y vuelves a correr
// setup(), se agregan solas a la hoja sin borrar datos.
const SHEETS = {
  Retos: ['ID_Reto', 'Fecha', 'Miembro', 'Tipo', 'Descripcion', 'Estado', 'KPI_Asociado', 'Meta_Numerica', 'Tareas_Clave'],
  Entregables: ['ID_Entregable', 'Fecha', 'Miembro', 'Tipo', 'Titulo', 'Link_Drive', 'Estado', 'Observaciones'],
  Metricas: ['ID_Metrica', 'Fecha', 'Miembro', 'Metrica', 'Valor_Esperado', 'Valor_Real', 'Cumplimiento_Porcentaje'],
  Usuarios: ['ID_Usuario', 'Nombre', 'Usuario', 'Password_Hash', 'Rol', 'Area', 'Activo']
};

const ID_PREFIXES = { Retos: 'R', Entregables: 'E', Metricas: 'M', Usuarios: 'U' };
const SESSION_TTL_SECONDS = 21600; // 6 horas
const SALT = 'CRK_2026_salt_v1';

function getSS() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function hashPassword(plain) {
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(plain) + SALT);
  return digest.map(function (b) {
    var v = (b + 256) % 256;
    var hex = v.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

function genRecordId(sheetName) {
  var p = ID_PREFIXES[sheetName] || 'X';
  return p + '-' + Utilities.getUuid().split('-')[0];
}

function hoyServidor() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy');
}

function getHeaders(sheet) {
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  return sheet.getRange(1, 1, 1, lastCol).getValues()[0];
}

function styleHeaderRow(sheet, numCols) {
  sheet.getRange(1, 1, 1, numCols).setFontWeight('bold').setBackground('#4F46E5').setFontColor('#FFFFFF');
}

// Agrega columnas nuevas al final de una hoja existente si faltan,
// sin tocar ni reordenar las columnas ni los datos ya guardados.
function ensureHeaders(sheet, expectedHeaders) {
  var existing = getHeaders(sheet).filter(function (v) { return v !== ''; });
  var toAdd = expectedHeaders.filter(function (h) { return existing.indexOf(h) === -1; });
  if (toAdd.length === 0) return;
  var startCol = existing.length + 1;
  sheet.getRange(1, startCol, 1, toAdd.length).setValues([toAdd]);
  styleHeaderRow(sheet, startCol + toAdd.length - 1);
}

// ------------------------------------------------------------
// setup(): crea las 4 pestañas si no existen, migra columnas
// nuevas si ya existían, y siembra el usuario admin por defecto.
// Se puede ejecutar varias veces sin riesgo: nunca borra datos.
// ------------------------------------------------------------
function setup() {
  var ss = getSS();
  Object.keys(SHEETS).forEach(function (name) {
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

  var usuarios = ss.getSheetByName('Usuarios');
  if (usuarios.getLastRow() <= 1) {
    var headers = getHeaders(usuarios);
    var seed = { Nombre: 'Administrador', Usuario: 'admin', Password_Hash: hashPassword('admin123'), Rol: 'admin', Area: 'Dirección', Activo: true };
    seed[headers[0]] = 'U-admin';
    var row = headers.map(function (h) { return seed.hasOwnProperty(h) ? seed[h] : ''; });
    usuarios.appendRow(row);
  }

  var defaultNames = ['Hoja 1', 'Sheet1'];
  defaultNames.forEach(function (n) {
    var s = ss.getSheetByName(n);
    if (s && ss.getSheets().length > 1) ss.deleteSheet(s);
  });

  SpreadsheetApp.flush();
  Logger.log('Listo: hojas creadas/migradas y usuario admin/admin123 sembrado (si no existía).');
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

function login(usuario, password) {
  var sheet = getSheet('Usuarios');
  var rows = sheet.getDataRange().getValues();
  var headers = rows.shift();
  var idx = {};
  headers.forEach(function (h, i) { idx[h] = i; });
  var hash = hashPassword(password);

  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (String(r[idx.Usuario]).toLowerCase() === String(usuario).toLowerCase()) {
      var activo = r[idx.Activo];
      if (activo === false || String(activo).toUpperCase() === 'FALSE') throw new Error('Este usuario está desactivado');
      if (String(r[idx.Password_Hash]) !== hash) throw new Error('Contraseña incorrecta');
      var userObj = {
        id: r[idx.ID_Usuario], nombre: r[idx.Nombre], usuario: r[idx.Usuario],
        rol: r[idx.Rol], area: idx.Area !== undefined ? r[idx.Area] : ''
      };
      var token = crearSesion(userObj);
      return { status: 'OK', token: token, user: userObj };
    }
  }
  throw new Error('Usuario no encontrado');
}

function changeOwnPassword(user, newPassword) {
  if (!newPassword || String(newPassword).length < 4) throw new Error('La contraseña debe tener al menos 4 caracteres');
  var sheet = getSheet('Usuarios');
  var rowNum = findRowById(sheet, 'ID_Usuario', user.id);
  if (rowNum === -1) throw new Error('Usuario no encontrado');
  var idxPass = getHeaders(sheet).indexOf('Password_Hash');
  sheet.getRange(rowNum, idxPass + 1).setValue(hashPassword(newPassword));
  return { status: 'OK', message: 'Contraseña actualizada' };
}

// ------------------------------------------------------------
// doGet: lectura de datos
//   ?action=getData&token=XXX -> devuelve datos según el rol
// ------------------------------------------------------------
function doGet(e) {
  var action = e.parameter.action;
  try {
    if (action === 'getData') {
      var user = getSession(e.parameter.token);
      if (!user) return jsonOut({ status: 'Error', message: 'Sesión inválida o expirada. Vuelve a iniciar sesión.' });
      return jsonOut({ status: 'OK', data: getAllData(user), user: user });
    }
    return jsonOut({ status: 'Error', message: 'Acción no válida' });
  } catch (err) {
    return jsonOut({ status: 'Error', message: err.toString() });
  }
}

// ------------------------------------------------------------
// doPost: login, logout, cambiar contraseña, y CRUD de datos
//   body = { action, sheet, id, data: {Campo: valor, ...}, token }
//
//   NOTA IMPORTANTE (CORS):
//   El frontend debe enviar el POST con
//   headers: {'Content-Type': 'text/plain;charset=utf-8'}
//   para evitar que el navegador dispare una petición OPTIONS
//   de preflight que Apps Script no sabe responder.
// ------------------------------------------------------------
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var action = body.action;

    if (action === 'login') return jsonOut(login(body.usuario, body.password));
    if (action === 'logout') { borrarSesion(body.token); return jsonOut({ status: 'OK' }); }

    var user = getSession(body.token);
    if (!user) return jsonOut({ status: 'Error', message: 'Sesión inválida o expirada. Vuelve a iniciar sesión.' });

    if (action === 'changePassword') return jsonOut(changeOwnPassword(user, body.newPassword));

    var sheetName = body.sheet;
    if (!SHEETS[sheetName]) throw new Error('Hoja no válida: ' + sheetName);
    if (sheetName === 'Usuarios' && user.rol !== 'admin') throw new Error('No autorizado: solo un administrador gestiona usuarios');

    if (action === 'create') return jsonOut(createRow(sheetName, body.data || {}, user));
    if (action === 'update') return jsonOut(updateRow(sheetName, body.id, body.data || {}, user));
    if (action === 'delete') return jsonOut(deleteRow(sheetName, body.id, user));
    throw new Error('Acción no válida: ' + action);
  } catch (err) {
    return jsonOut({ status: 'Error', message: err.toString() });
  }
}

function getSheet(name) {
  var sheet = getSS().getSheetByName(name);
  if (!sheet) throw new Error('No existe la hoja "' + name + '". Ejecuta la función setup() primero.');
  return sheet;
}

// Devuelve los datos visibles para ese usuario:
// - admin: ve todo, incluida la lista de Usuarios (sin password).
// - miembro: solo ve sus propias filas en Retos/Entregables/Metricas,
//   y no recibe la hoja Usuarios.
function getAllData(user) {
  var data = {};
  Object.keys(SHEETS).forEach(function (name) {
    if (name === 'Usuarios' && user.rol !== 'admin') return;

    var sheet = getSheet(name);
    var rows = sheet.getDataRange().getValues();
    var headers = rows.shift();
    var idxMiembro = headers.indexOf('Miembro');

    var list = rows.map(function (row) {
      var obj = {};
      headers.forEach(function (h, i) { obj[h] = row[i]; });
      return obj;
    });

    if (name !== 'Usuarios' && user.rol !== 'admin' && idxMiembro !== -1) {
      list = list.filter(function (o) { return o.Miembro === user.nombre; });
    }
    if (name === 'Usuarios') {
      list = list.map(function (o) { var c = Object.assign({}, o); delete c.Password_Hash; return c; });
    }
    data[name] = list;
  });
  return data;
}

function findRowById(sheet, idColName, id) {
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  var idCol = headers.indexOf(idColName);
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][idCol]) === String(id)) return i + 1; // fila 1-indexada
  }
  return -1;
}

// Crea un registro a partir de un objeto {Campo: valor}. El ID y la
// Fecha los pone siempre el servidor. Usa los encabezados reales de
// la hoja (no un orden fijo), así que es inmune a columnas agregadas
// después con ensureHeaders().
function createRow(sheetName, dataObj, user) {
  var sheet = getSheet(sheetName);
  var headers = getHeaders(sheet);
  var idColName = headers[0];

  dataObj = Object.assign({}, dataObj);
  dataObj[idColName] = genRecordId(sheetName);
  if (headers.indexOf('Fecha') !== -1) dataObj.Fecha = hoyServidor();

  if (sheetName === 'Usuarios') {
    if (dataObj.Password_Hash) dataObj.Password_Hash = hashPassword(dataObj.Password_Hash);
  } else if (user.rol !== 'admin') {
    if (headers.indexOf('Miembro') !== -1) dataObj.Miembro = user.nombre; // fuerza propiedad
    if (sheetName === 'Entregables') dataObj.Estado = 'En Revisión'; // los miembros siempre crean en revisión
  }

  var row = headers.map(function (h) { return dataObj.hasOwnProperty(h) ? dataObj[h] : ''; });
  sheet.appendRow(row);
  return { status: 'OK', message: 'Guardado exitoso', id: dataObj[idColName] };
}

// Actualiza SOLO los campos presentes en dataObj (actualización
// parcial); el resto de la fila queda igual. Permite, por ejemplo,
// que el admin apruebe un entregable enviando únicamente {Estado:...}.
function updateRow(sheetName, id, dataObj, user) {
  var sheet = getSheet(sheetName);
  var headers = getHeaders(sheet);
  var idColName = headers[0];
  var rowNum = findRowById(sheet, idColName, id);
  if (rowNum === -1) throw new Error('Registro no encontrado: ' + id);

  var existingRow = sheet.getRange(rowNum, 1, 1, headers.length).getValues()[0];
  var existingObj = {};
  headers.forEach(function (h, i) { existingObj[h] = existingRow[i]; });

  dataObj = Object.assign({}, dataObj);

  if (sheetName === 'Usuarios') {
    if (dataObj.Password_Hash) dataObj.Password_Hash = hashPassword(dataObj.Password_Hash);
    else delete dataObj.Password_Hash; // no se envió: no tocar
  } else if (user.rol !== 'admin') {
    if (headers.indexOf('Miembro') !== -1 && existingObj.Miembro !== user.nombre) throw new Error('No autorizado: no es tu registro');
    if (headers.indexOf('Miembro') !== -1) dataObj.Miembro = user.nombre;
    if (sheetName === 'Entregables') delete dataObj.Estado; // un miembro no puede cambiar el estado de aprobación
  }

  var merged = Object.assign({}, existingObj, dataObj);
  var row = headers.map(function (h) { return merged[h]; });
  sheet.getRange(rowNum, 1, 1, row.length).setValues([row]);
  return { status: 'OK', message: 'Actualizado exitosamente' };
}

function deleteRow(sheetName, id, user) {
  if (user.rol !== 'admin') throw new Error('Solo un administrador puede eliminar registros');
  var sheet = getSheet(sheetName);
  var idColName = getHeaders(sheet)[0];
  var rowNum = findRowById(sheet, idColName, id);
  if (rowNum === -1) throw new Error('Registro no encontrado: ' + id);
  sheet.deleteRow(rowNum);
  return { status: 'OK', message: 'Eliminado exitosamente' };
}
