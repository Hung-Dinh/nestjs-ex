import { EntityRepository, Repository } from 'typeorm';

import { BlockchainTx } from '../entities/blockchain-tx.entity';

@EntityRepository(BlockchainTx)
export class BlockchainTxRepository extends Repository<BlockchainTx> {}
