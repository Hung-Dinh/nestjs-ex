import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterTableMessage1642651976619 implements MigrationInterface {
    name = 'AlterTableMessage1642651976619';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`messages\` CHANGE \`numberOfTxs\` \`numberOfTxs\` int NULL DEFAULT '1'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`messages\` CHANGE \`numberOfTxs\` \`numberOfTxs\` int NULL
        `);
    }
}
