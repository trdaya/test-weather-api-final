import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class AddLocationEntityIndexes1734000966522
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createIndex(
      'locations',
      new TableIndex({
        name: 'IDX_LOCATION_NAME',
        columnNames: ['name'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('locations', 'IDX_LOCATION_NAME');
  }
}
