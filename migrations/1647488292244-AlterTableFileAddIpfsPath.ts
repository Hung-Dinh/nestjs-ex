import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterTableFileAddIpfsPath1647488292244
    implements MigrationInterface
{
    name = 'AlterTableFileAddIpfsPath1647488292244';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`files\`
            ADD \`ipfsPath\` varchar(255) NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`files\` DROP COLUMN \`ipfsPath\`
        `);
    }
}
