const { encrypt, decrypt } = require('../utils/encryption');

// Fields to encrypt in medical records
const SENSITIVE_FIELDS = ['symptoms', 'prescription', 'notes', 'diagnosis', 'allergies'];

const encryptMedicalData = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const result = { ...obj };
  SENSITIVE_FIELDS.forEach(field => {
    if (result[field]) {
      if (Array.isArray(result[field])) {
        result[field] = result[field].map(v => encrypt(String(v)));
      } else {
        result[field] = encrypt(String(result[field]));
      }
    }
  });
  return result;
};

const decryptMedicalData = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const result = typeof obj.toObject === 'function' ? obj.toObject() : { ...obj };
  SENSITIVE_FIELDS.forEach(field => {
    if (result[field]) {
      if (Array.isArray(result[field])) {
        result[field] = result[field].map(v => decrypt(String(v)));
      } else {
        result[field] = decrypt(String(result[field]));
      }
    }
  });
  return result;
};


// ── Appointment
const encryptAppointment = (data) => encryptMedicalData(data);
const decryptAppointment = (data) => decryptMedicalData(data);

// ── Lab Report fields
const LAB_FIELDS = ['doctorNotes', 'fileData'];

const encryptLabReport = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const result = { ...obj };
  LAB_FIELDS.forEach(field => {
    if (result[field]) result[field] = encrypt(String(result[field]));
  });
  return result;
};

const decryptLabReport = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const result = typeof obj.toObject === 'function' ? obj.toObject() : { ...obj };
  LAB_FIELDS.forEach(field => {
    if (result[field]) result[field] = decrypt(String(result[field]));
  });
  return result;
};

// ── User sensitive fields
const USER_FIELDS = ['address', 'emergencyContact'];
const USER_ARRAY_FIELDS = ['allergies', 'chronicConditions'];

const encryptUserSensitive = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const result = { ...obj };
  USER_FIELDS.forEach(field => { if (result[field]) result[field] = encrypt(String(result[field])); });
  USER_ARRAY_FIELDS.forEach(field => { if (Array.isArray(result[field])) result[field] = result[field].map(v => encrypt(String(v))); });
  return result;
};

const decryptUserSensitive = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const result = typeof obj.toObject === 'function' ? obj.toObject() : { ...obj };
  USER_FIELDS.forEach(field => { if (result[field]) result[field] = decrypt(String(result[field])); });
  USER_ARRAY_FIELDS.forEach(field => { if (Array.isArray(result[field])) result[field] = result[field].map(v => decrypt(String(v))); });
  return result;
};

// ── Decrypt an array of records
const decryptList = (list, decryptFn) => {
  if (!Array.isArray(list)) return list;
  return list.map(decryptFn);
};

// ── SINGLE module.exports — replaces the old one
module.exports = {
  encryptMedicalData, decryptMedicalData, SENSITIVE_FIELDS,
  encryptAppointment, decryptAppointment,
  encryptLabReport,   decryptLabReport,
  encryptUserSensitive, decryptUserSensitive,
  decryptList,
};

