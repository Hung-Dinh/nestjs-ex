import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterTableMessageAddFileInfo1650437388726
    implements MigrationInterface
{
    name = 'AlterTableMessageAddFileInfo1650437388726';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`messages\`
            ADD \`fileInfo\` text NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`messages\` DROP COLUMN \`fileInfo\`
        `);
    }
}
