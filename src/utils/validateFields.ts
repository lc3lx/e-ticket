const validateFieldsNames = (acceptedFields: string[], receivedFields: string[]) => {
  const invalidFields = receivedFields.filter((field) => !acceptedFields.includes(field));
  if (invalidFields.length > 0) return invalidFields;

  return true;
};

export default validateFieldsNames;
