import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterTableFileAlterFileInfoProperty1648578377021
    implements MigrationInterface
{
    name = 'AlterTableFileAlterFileInfoProperty1648578377021';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`files\` DROP COLUMN \`filename\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`files\` DROP COLUMN \`filesize\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`files\` DROP COLUMN \`filetype\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`files\`
            ADD \`fileInfo\` text NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`files\` DROP COLUMN \`fileInfo\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`files\`
            ADD \`filetype\` varchar(255) NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`files\`
            ADD \`filesize\` int NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`files\`
            ADD \`filename\` varchar(255) NULL
        `);
    }
}
