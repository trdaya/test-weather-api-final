import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class AddUserEntityIndexes1734000955688 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_USER_EMAIL',
        columnNames: ['email'],
        isUnique: true,
      })
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_USER_IS_ACTIVE',
        columnNames: ['isActive'],
      })
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_USER_ID',
        columnNames: ['id'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('users', 'IDX_USER_EMAIL');
    await queryRunner.dropIndex('users', 'IDX_USER_IS_ACTIVE');
    await queryRunner.dropIndex('users', 'IDX_USER_ID');
  }
}
