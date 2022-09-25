import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMessageTxTable1642383712608 implements MigrationInterface {
    name = 'CreateMessageTxTable1642383712608';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`chat_room\`
            ADD \`networkId\` int NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`chat_room\` DROP COLUMN \`networkId\`
        `);
    }
}
