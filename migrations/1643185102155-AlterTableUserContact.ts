import {MigrationInterface, QueryRunner} from "typeorm";

export class AlterTableUserContact1643185102155 implements MigrationInterface {
    name = 'AlterTableUserContact1643185102155'

    public async up(queryRunner: QueryRunner): Promise<void> {
       await queryRunner.query(`ALTER TABLE \`user_contact\` CHANGE \`name\` \`name\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
       await queryRunner.query(`ALTER TABLE \`user_contact\` CHANGE \`name\` \`name\` varchar(255) NOT NULL`);
    }

}
