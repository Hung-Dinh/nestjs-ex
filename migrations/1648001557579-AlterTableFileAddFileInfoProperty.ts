import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterTableFileAddFileInfoProperty1648001557579
    implements MigrationInterface
{
    name = 'AlterTableFileAddFileInfoProperty1648001557579';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`files\`
            ADD \`filename\` varchar(255) NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`files\`
            ADD \`filesize\` int NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`files\`
            ADD \`filetype\` varchar(255) NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`files\` DROP COLUMN \`path\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`files\`
            ADD \`path\` text NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`files\` DROP COLUMN \`path\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`files\`
            ADD \`path\` text NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`files\` DROP COLUMN \`filetype\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`files\` DROP COLUMN \`filesize\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`files\` DROP COLUMN \`filename\`
        `);
    }
}
