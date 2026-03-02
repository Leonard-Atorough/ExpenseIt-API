export default abstract class BaseEntity {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;

  protected constructor(id: string | undefined, createdAt?: Date, updatedAt?: Date) {
    this.id = id;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
