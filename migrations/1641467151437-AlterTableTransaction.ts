import {MigrationInterface, QueryRunner} from "typeorm";

export class AlterTableTransaction1641467151437 implements MigrationInterface {
    name = 'AlterTableTransaction1641467151437'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`transaction\` ADD \`tokenSymbol\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`transaction\` ADD \`tokenAddress\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`transaction\` ADD \`feeLevel\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`transaction\` DROP COLUMN \`feeLevel\``);
        await queryRunner.query(`ALTER TABLE \`transaction\` DROP COLUMN \`tokenAddress\``);
        await queryRunner.query(`ALTER TABLE \`transaction\` DROP COLUMN \`tokenSymbol\``);
    }  

}
