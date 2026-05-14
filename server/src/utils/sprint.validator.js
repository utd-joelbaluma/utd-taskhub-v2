const VALID_STATUSES = ['planned', 'active', 'completed'];

function isValidDate(str) {
  const d = new Date(str);
  return !isNaN(d.getTime());
}

function isMonday(dateStr) {
  const d = new Date(dateStr);
  return d.getUTCDay() === 1;
}

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function validateCreateSprint(payload) {
  const errors = [];
  const { name, start_date, end_date, status } = payload;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Sprint name is required and must be at least 2 characters.');
  }

  if (!start_date) {
    errors.push('start_date is required.');
  } else if (!isValidDate(start_date)) {
    errors.push('start_date must be a valid ISO date.');
  } else if (!isMonday(start_date)) {
    errors.push('start_date must be a Monday.');
  } else if (end_date) {
    if (!isValidDate(end_date)) {
      errors.push('end_date must be a valid ISO date.');
    } else if (end_date !== addDays(start_date, 4)) {
      errors.push('end_date must be exactly 4 days after start_date (Friday of the same week).');
    }
  }

  if (status && !VALID_STATUSES.includes(status)) {
    errors.push(`status must be one of: ${VALID_STATUSES.join(', ')}.`);
  }

  return errors;
}

export function validateUpdateSprint(payload) {
  const errors = [];
  const { name, start_date, end_date, status } = payload;

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length < 2) {
      errors.push('Sprint name must be at least 2 characters.');
    }
  }

  if (start_date !== undefined) {
    if (!isValidDate(start_date)) {
      errors.push('start_date must be a valid ISO date.');
    } else if (!isMonday(start_date)) {
      errors.push('start_date must be a Monday.');
    } else if (end_date !== undefined) {
      if (!isValidDate(end_date)) {
        errors.push('end_date must be a valid ISO date.');
      } else if (end_date !== addDays(start_date, 4)) {
        errors.push('end_date must be exactly 4 days after start_date (Friday of the same week).');
      }
    }
  }

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    errors.push(`status must be one of: ${VALID_STATUSES.join(', ')}.`);
  }

  return errors;
}

export function computeEndDate(startDate) {
  return addDays(startDate, 4);
}
