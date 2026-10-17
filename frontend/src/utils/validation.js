export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateRequired = (value) => {
  return value !== undefined && value !== null && String(value).trim().length > 0;
};

export const validateMinLength = (value, minLength) => {
  return value && String(value).trim().length >= minLength;
};

export const validateFutureDate = (dateString) => {
  if (!dateString) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(dateString);
  return !isNaN(dueDate.getTime()) && dueDate >= today;
};

export const validateTicketForm = (formData, isUpdate = false) => {
  const errors = {};

  if (!validateRequired(formData.customerName)) {
    errors.customerName = 'Customer name is required';
  } else if (!validateMinLength(formData.customerName, 2)) {
    errors.customerName = 'Customer name must be at least 2 characters';
  }

  if (!validateRequired(formData.customerEmail)) {
    errors.customerEmail = 'Customer email is required';
  } else if (!validateEmail(formData.customerEmail)) {
    errors.customerEmail = 'Please enter a valid email address';
  }

  if (!validateRequired(formData.issueCategory)) {
    errors.issueCategory = 'Issue category is required';
  } else if (!['Technical', 'Billing', 'Account', 'Other'].includes(formData.issueCategory)) {
    errors.issueCategory = 'Select a valid issue category';
  }

  if (!validateRequired(formData.priority)) {
    errors.priority = 'Priority is required';
  } else if (!['Low', 'Medium', 'High'].includes(formData.priority)) {
    errors.priority = 'Select a valid priority';
  }

  if (!validateRequired(formData.description)) {
    errors.description = 'Description is required';
  } else if (!validateMinLength(formData.description, 20)) {
    errors.description = 'Description must be at least 20 characters long';
  }

  if (!validateRequired(formData.dueDate)) {
    errors.dueDate = 'Due date is required';
  } else if (!validateFutureDate(formData.dueDate)) {
    errors.dueDate = 'Due date cannot be in the past';
  }

  if (isUpdate && !validateRequired(formData.status)) {
    errors.status = 'Status is required';
  }

  return errors;
};