import {MigrationInterface, QueryRunner} from "typeorm";

export class AlterTableMessages1643181489287 implements MigrationInterface {
    name = 'AlterTableMessages1643181489287'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`messages\` ADD \`transactionId\` bigint NULL`);
        
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
       await queryRunner.query(`ALTER TABLE \`messages\` DROP COLUMN \`transactionId\``);
       
    }

}
