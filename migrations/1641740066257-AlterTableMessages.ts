import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterTableMessages1641740066257 implements MigrationInterface {
    name = 'AlterTableMessages1641740066257';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE \`messages\` ADD \`walletAddress\` varchar(255) NOT NULL`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE \`messages\` DROP COLUMN \`walletAddress\``,
        );
    }
}
