import {MigrationInterface, QueryRunner} from "typeorm";

export class AlterTableMessages1643194817389 implements MigrationInterface {
    name = 'AlterTableMessages1643194817389'

    public async up(queryRunner: QueryRunner): Promise<void> {
       await queryRunner.query(`ALTER TABLE \`messages\` CHANGE \`content\` \`content\` text NULL`);
       await queryRunner.query(`ALTER TABLE \`blockchainTx\` CHANGE \`msgValue\` \`msgValue\` text NULL`);
       await queryRunner.query(`ALTER TABLE \`blockchainTx\` CHANGE \`msgData\` \`msgData\` text NULL`);
       await queryRunner.query(`ALTER TABLE \`blockchainTx\` CHANGE \`unsignedRaw\` \`unsignedRaw\` text NULL`);
       await queryRunner.query(`ALTER TABLE \`blockchainTx\` CHANGE \`signedRaw\` \`signedRaw\` text NULL`);
       
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`messages\` CHANGE \`content\` \`content\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`blockchainTx\` CHANGE \`msgValue\` \`msgValue\` varchar(255) NULL`);
       await queryRunner.query(`ALTER TABLE \`blockchainTx\` CHANGE \`msgData\` \`msgData\` varchar(255) NULL`);
       await queryRunner.query(`ALTER TABLE \`blockchainTx\` CHANGE \`unsignedRaw\` \`unsignedRaw\` varchar(255) NULL`);
       await queryRunner.query(`ALTER TABLE \`blockchainTx\` CHANGE \`signedRaw\` \`signedRaw\` varchar(255) NULL`);
        
    }

}
