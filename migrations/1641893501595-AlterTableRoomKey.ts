import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterTableRoomKey1641893501595 implements MigrationInterface {
    name = 'AlterTableRoomKey1641893501595';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`room_key\`
            ADD \`iv\` varchar(255) NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`member_in_room\` CHANGE \`addedByUserId\` \`addedByUserId\` bigint NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`member_in_room\` CHANGE \`addedByUserId\` \`addedByUserId\` bigint NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`room_key\` DROP COLUMN \`iv\`
        `);
    }
}
