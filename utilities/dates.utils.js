const { TIMEZONE } = require('../config/constants');


function getCurrentDate() {
  const now = new Date();
  const lagosDate = new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE }));
  return lagosDate.toISOString().split('T')[0];
}

function toTimezoneDate(date) {
  const d = new Date(date);
  const lagosDate = new Date(d.toLocaleString('en-US', { timeZone: TIMEZONE }));
  return lagosDate.toISOString().split('T')[0];
}

function getCurrentTimestamp() {
  return new Date().toISOString();
}

module.exports = {
  getCurrentDate,
  toTimezoneDate,
  getCurrentTimestamp
};