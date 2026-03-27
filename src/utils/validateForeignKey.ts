import { Model, ModelStatic } from 'sequelize';

/**
 * Validate the foreign key existence in the database.
 * @param model - The Sequelize model to query (e.g., EventType, Province)
 * @param id - The ID to check
 * @param modelName - A string representing the model name for the error message
 * @returns boolean - True if the foreign key is valid, otherwise throws an error
 */
// eslint-disable-next-line import/prefer-default-export
export const validateForeignKey = async (
  model: ModelStatic<Model>,
  id: number,
  modelName: string,
): Promise<boolean> => {
  const record = await model.findByPk(id);
  if (!record) {
    console.error(`Invalid ${modelName} ID: ${id}`);
    return false;
  }

  return true;
};
