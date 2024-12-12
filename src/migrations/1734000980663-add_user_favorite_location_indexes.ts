import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class AddUserFavoriteLocationIndexes1734000980663
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createIndex(
      'user_favorite_locations',
      new TableIndex({
        name: 'IDX_USER_FAVORITE_LOCATIONS_USER_ID',
        columnNames: ['userId'],
      })
    );

    await queryRunner.createIndex(
      'user_favorite_locations',
      new TableIndex({
        name: 'IDX_USER_FAVORITE_LOCATIONS_LOCATION_ID',
        columnNames: ['locationId'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      'user_favorite_locations',
      'IDX_USER_FAVORITE_LOCATIONS_USER_ID'
    );
    await queryRunner.dropIndex(
      'user_favorite_locations',
      'IDX_USER_FAVORITE_LOCATIONS_LOCATION_ID'
    );
  }
}
