import 'dotenv/config';

export const POLYGON = {
  p2pContractAddress: process.env.P2PCHAT_CONTRACT,
  systemAdminAddress: process.env.SYSTEM_ADMIN_ADDRESS,
  feeRate: {
    SMALL: 1,
    MEDIUM: 1.2,
    FAST: 1.5,
  },
  groupChatBytecode:
    '0x60806040523480156200001157600080fd5b506040516200245f3803806200245f8339810160408190526200003491620001ee565b6200003f33620000f8565b6000805460ff60a01b191690556001600160a01b0382166200007357600680546001600160a01b031916331790556200008f565b600680546001600160a01b0319166001600160a01b0384161790555b8051620000a490600890602084019062000148565b50506006546001600160a01b03166000908152600a602090815260408083208054600160ff1991821681179092553385528285208054821683179055600b9093529220805490911690911790555062000341565b600080546001600160a01b038381166001600160a01b0319831681178455604051919092169283917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09190a35050565b8280546200015690620002ee565b90600052602060002090601f0160209004810192826200017a5760008555620001c5565b82601f106200019557805160ff1916838001178555620001c5565b82800160010185558215620001c5579182015b82811115620001c5578251825591602001919060010190620001a8565b50620001d3929150620001d7565b5090565b5b80821115620001d35760008155600101620001d8565b600080604083850312156200020257600080fd5b82516001600160a01b03811681146200021a57600080fd5b602084810151919350906001600160401b03808211156200023a57600080fd5b818601915086601f8301126200024f57600080fd5b8151818111156200026457620002646200032b565b604051601f8201601f19908116603f011681019083821181831017156200028f576200028f6200032b565b816040528281528986848701011115620002a857600080fd5b600093505b82841015620002cc5784840186015181850187015292850192620002ad565b82841115620002de5760008684830101525b8096505050505050509250929050565b600181811c908216806200030357607f821691505b602082108114156200032557634e487b7160e01b600052602260045260246000fd5b50919050565b634e487b7160e01b600052604160045260246000fd5b61210e80620003516000396000f3fe608060405234801561001057600080fd5b50600436106101d05760003560e01c8063782ab64211610105578063b2386e9a1161009d578063b2386e9a14610419578063b36022f31461042e578063c18b5aef14610441578063c748776d14610454578063d929911814610467578063d970714b1461047a578063ddca3f4314610482578063e1812d3e1461048b578063f2fde38b1461049e57600080fd5b8063782ab6421461035f5780637a80760e146103725780637dfdba341461039d5780638bb23371146103b25780638da5cb5b146103c5578063946d6769146103cd5780639d0101d3146103e0578063a239e33d146103f3578063a923c1091461040657600080fd5b806331c7e26b1161017857806331c7e26b1461027c57806333ecc5a61461028f5780633f831ec2146102af5780634c2fc2dd146102c25780635a35c95f146102da5780635ae0753d146102ed5780635c975abb1461031957806366ca02a21461032b578063715018a61461035757600080fd5b8062172ddf146101d5578063076822e4146101ea578063100aca47146101fd57806313d321cf146102195780631bc831a41461022c578063210d50e11461023f57806322d4cdd314610252578063314af5b414610273575b600080fd5b6101e86101e3366004611b68565b6104b1565b005b6101e86101f8366004611b81565b6104e9565b61020660035481565b6040519081526020015b60405180910390f35b6101e8610227366004611a5d565b610696565b6101e861023a366004611a5d565b610776565b6101e861024d366004611b33565b61080d565b610265610260366004611b68565b61084f565b604051610210929190611f73565b61020660045481565b6101e861028a366004611a5d565b610907565b6102a261029d366004611b68565b6109d9565b6040516102109190611d32565b6101e86102bd366004611a5d565b610bcd565b6102ca610c5f565b6040519015158152602001610210565b6101e86102e8366004611b68565b610caa565b6102ca6102fb366004611a42565b6001600160a01b03166000908152600a602052604090205460ff1690565b600054600160a01b900460ff166102ca565b6102ca610339366004611a42565b6001600160a01b031660009081526009602052604090205460ff1690565b6101e8610d74565b6101e861036d366004611a5d565b610daf565b600154610385906001600160a01b031681565b6040516001600160a01b039091168152602001610210565b6103a5610e76565b6040516102109190611e84565b600d54610385906001600160a01b031681565b610385610f08565b6101e86103db366004611a5d565b610f17565b6101e86103ee366004611a42565b610fb2565b600654610385906001600160a01b031681565b6101e8610414366004611a42565b611031565b336000908152600c6020526040902054610206565b6101e861043c366004611a5d565b61107d565b6101e861044f366004611a42565b611114565b6101e8610462366004611a5d565b611160565b6103a5610475366004611b68565b6111f7565b6102066112a3565b61020660055481565b6101e8610499366004611c4b565b6112ec565b6101e86104ac366004611a42565b61144d565b6006546001600160a01b031633146104e45760405162461bcd60e51b81526004016104db90611f0d565b60405180910390fd5b600555565b600054600160a01b900460ff16156105365760405162461bcd60e51b815260206004820152601060248201526f14185d5cd8589b194e881c185d5cd95960821b60448201526064016104db565b336000818152600a602052604090205460ff166105655760405162461bcd60e51b81526004016104db90611f3e565b3360009081526009602052604090205460ff16156105955760405162461bcd60e51b81526004016104db90611e97565b604080518082019091528381526020808201848152600280546001810182556000829052845191027f405787fa12a823e0f2b7631cc41b3ba8828b3321ca811111fa75cd3aa3bb5ace8101918255915180519193610618937f405787fa12a823e0f2b7631cc41b3ba8828b3321ca811111fa75cd3aa3bb5acf0192910190611847565b505060055415905061065657600554600154610643916001600160a01b0390911690339030906114ed565b6005546003546106529161155e565b6003555b7f0ca32f87bd9ff5e4edfd562745529b557b8be4caacccdf279fd3ab9aa118598833848460405161068993929190611cb5565b60405180910390a1505050565b336000818152600b602052604090205460ff166106c55760405162461bcd60e51b81526004016104db90611f3e565b60005b8251811015610771576002600c60008584815181106106e9576106e96120ac565b60200260200101516001600160a01b03166001600160a01b03168152602001908152602001600020819055506001600a600085848151811061072d5761072d6120ac565b6020908102919091018101516001600160a01b03168252810191909152604001600020805460ff1916911515919091179055806107698161207b565b9150506106c8565b505050565b336000818152600b602052604090205460ff166107a55760405162461bcd60e51b81526004016104db90611f3e565b60005b8251811015610771576000600a60008584815181106107c9576107c96120ac565b6020908102919091018101516001600160a01b03168252810191909152604001600020805460ff1916911515919091179055806108058161207b565b9150506107a8565b336000818152600b602052604090205460ff1661083c5760405162461bcd60e51b81526004016104db90611f3e565b8151610771906008906020850190611847565b6002818154811061085f57600080fd5b6000918252602090912060029091020180546001820180549193509061088490612040565b80601f01602080910402602001604051908101604052809291908181526020018280546108b090612040565b80156108fd5780601f106108d2576101008083540402835291602001916108fd565b820191906000526020600020905b8154815290600101906020018083116108e057829003601f168201915b5050505050905082565b33610910610f08565b6001600160a01b0316146109365760405162461bcd60e51b81526004016104db90611ed8565b60005b815181101561099e5760006009600084848151811061095a5761095a6120ac565b6020908102919091018101516001600160a01b03168252810191909152604001600020805460ff1916911515919091179055806109968161207b565b915050610939565b507fed1089a5bee85ad50061c5fadb7a95f3a34974137d5764bc45264e56082a7f7f816040516109ce9190611ce5565b60405180910390a150565b3360009081526009602052604090205460609060ff1615610a0c5760405162461bcd60e51b81526004016104db90611e97565b610a18600760006118cb565b60005b600254811015610abb578260028281548110610a3957610a396120ac565b9060005260206000209060020201600001541415610aa957600760028281548110610a6657610a666120ac565b600091825260208083208454600181810187559585529190932060029092029092019290920180549290910191610a9c90612040565b610aa79291906118e9565b505b80610ab38161207b565b915050610a1b565b507fa2737def5652ab3da8d5ea3c9c15089c8910af8dd5651b7afc711ce41d09042b6007604051610aec9190611d94565b60405180910390a16007805480602002602001604051908101604052809291908181526020016000905b82821015610bc2578382906000526020600020018054610b3590612040565b80601f0160208091040260200160405190810160405280929190818152602001828054610b6190612040565b8015610bae5780601f10610b8357610100808354040283529160200191610bae565b820191906000526020600020905b815481529060010190602001808311610b9157829003601f168201915b505050505081526020019060010190610b16565b505050509050919050565b336000818152600b602052604090205460ff16610bfc5760405162461bcd60e51b81526004016104db90611f3e565b60005b8251811015610771576003600c6000858481518110610c2057610c206120ac565b60200260200101516001600160a01b03166001600160a01b03168152602001908152602001600020819055508080610c579061207b565b915050610bff565b3360009081526009602052604081205460ff1615610c8f5760405162461bcd60e51b81526004016104db90611e97565b50336000908152600a60205260408120805460ff1916905590565b33610cb3610f08565b6001600160a01b031614610cd95760405162461bcd60e51b81526004016104db90611ed8565b60008111610d1d5760405162461bcd60e51b8152602060048201526011602482015270063616e6e6f74207769746864726177203607c1b60448201526064016104db565b600154610d34906001600160a01b03163383611571565b600354610d4190826115a1565b6003556040518181527f01a58a58bd40c1bce634617ec05cbbf149ee2461d2180618aa23960f5d4d9d55906020016109ce565b33610d7d610f08565b6001600160a01b031614610da35760405162461bcd60e51b81526004016104db90611ed8565b610dad60006115ad565b565b33610db8610f08565b6001600160a01b031614610dde5760405162461bcd60e51b81526004016104db90611ed8565b60005b8151811015610e4657600160096000848481518110610e0257610e026120ac565b6020908102919091018101516001600160a01b03168252810191909152604001600020805460ff191691151591909117905580610e3e8161207b565b915050610de1565b507fe8afb068bd6c000409929b88cad3733a8b0ddfc4d8ba13a7c2a44111a3914afe816040516109ce9190611ce5565b606060088054610e8590612040565b80601f0160208091040260200160405190810160405280929190818152602001828054610eb190612040565b8015610efe5780601f10610ed357610100808354040283529160200191610efe565b820191906000526020600020905b815481529060010190602001808311610ee157829003601f168201915b5050505050905090565b6000546001600160a01b031690565b33610f20610f08565b6001600160a01b031614610f465760405162461bcd60e51b81526004016104db90611ed8565b60005b8151811015610fae576001600b6000848481518110610f6a57610f6a6120ac565b6020908102919091018101516001600160a01b03168252810191909152604001600020805460ff191691151591909117905580610fa68161207b565b915050610f49565b5050565b6006546001600160a01b03163314610fdc5760405162461bcd60e51b81526004016104db90611f0d565b600680546001600160a01b0319166001600160a01b0383169081179091556040805133815260208101929092527ff969a32fb03c29eb8b7337cea774efa400f0be5c29f10c34e9b5caf49eb37b1b91016109ce565b6006546001600160a01b0316331461105b5760405162461bcd60e51b81526004016104db90611f0d565b600180546001600160a01b0319166001600160a01b0392909216919091179055565b336000818152600b602052604090205460ff166110ac5760405162461bcd60e51b81526004016104db90611f3e565b60005b8251811015610771576001600a60008584815181106110d0576110d06120ac565b6020908102919091018101516001600160a01b03168252810191909152604001600020805460ff19169115159190911790558061110c8161207b565b9150506110af565b6006546001600160a01b0316331461113e5760405162461bcd60e51b81526004016104db90611f0d565b600d80546001600160a01b0319166001600160a01b0392909216919091179055565b33611169610f08565b6001600160a01b03161461118f5760405162461bcd60e51b81526004016104db90611ed8565b60005b8151811015610fae576000600b60008484815181106111b3576111b36120ac565b6020908102919091018101516001600160a01b03168252810191909152604001600020805460ff1916911515919091179055806111ef8161207b565b915050611192565b6007818154811061120757600080fd5b90600052602060002001600091509050805461122290612040565b80601f016020809104026020016040519081016040528092919081815260200182805461124e90612040565b801561129b5780601f106112705761010080835404028352916020019161129b565b820191906000526020600020905b81548152906001019060200180831161127e57829003601f168201915b505050505081565b3360009081526009602052604081205460ff16156112d35760405162461bcd60e51b81526004016104db90611e97565b50336000908152600c6020526040902060019081905590565b336112f5610f08565b6001600160a01b03161461131b5760405162461bcd60e51b81526004016104db90611ed8565b815b81811161077157600d546040516322d4cdd360e01b81526004810183905260009182916001600160a01b03909116906322d4cdd39060240160006040518083038186803b15801561136d57600080fd5b505afa158015611381573d6000803e3d6000fd5b505050506040513d6000823e601f3d908101601f191682016040526113a99190810190611bc8565b604080518082019091528281526020808201838152600280546001810182556000829052845191027f405787fa12a823e0f2b7631cc41b3ba8828b3321ca811111fa75cd3aa3bb5ace81019182559151805196985094965092949293611435937f405787fa12a823e0f2b7631cc41b3ba8828b3321ca811111fa75cd3aa3bb5acf909201920190611847565b505050505080806114459061207b565b91505061131d565b33611456610f08565b6001600160a01b03161461147c5760405162461bcd60e51b81526004016104db90611ed8565b6001600160a01b0381166114e15760405162461bcd60e51b815260206004820152602660248201527f4f776e61626c653a206e6577206f776e657220697320746865207a65726f206160448201526564647265737360d01b60648201526084016104db565b6114ea816115ad565b50565b6040516001600160a01b03808516602483015283166044820152606481018290526115589085906323b872dd60e01b906084015b60408051601f198184030181529190526020810180516001600160e01b03166001600160e01b0319909316929092179091526115fd565b50505050565b600061156a8284611fe5565b9392505050565b6040516001600160a01b03831660248201526044810182905261077190849063a9059cbb60e01b90606401611521565b600061156a8284611ffd565b600080546001600160a01b038381166001600160a01b0319831681178455604051919092169283917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09190a35050565b6000611652826040518060400160405280602081526020017f5361666545524332303a206c6f772d6c6576656c2063616c6c206661696c6564815250856001600160a01b03166116cf9092919063ffffffff16565b80519091501561077157808060200190518101906116709190611b11565b6107715760405162461bcd60e51b815260206004820152602a60248201527f5361666545524332303a204552433230206f7065726174696f6e20646964206e6044820152691bdd081cdd58d8d9595960b21b60648201526084016104db565b60606116de84846000856116e6565b949350505050565b6060824710156117475760405162461bcd60e51b815260206004820152602660248201527f416464726573733a20696e73756666696369656e742062616c616e636520666f6044820152651c8818d85b1b60d21b60648201526084016104db565b843b6117955760405162461bcd60e51b815260206004820152601d60248201527f416464726573733a2063616c6c20746f206e6f6e2d636f6e747261637400000060448201526064016104db565b600080866001600160a01b031685876040516117b19190611c99565b60006040518083038185875af1925050503d80600081146117ee576040519150601f19603f3d011682016040523d82523d6000602084013e6117f3565b606091505b509150915061180382828661180e565b979650505050505050565b6060831561181d57508161156a565b82511561182d5782518084602001fd5b8160405162461bcd60e51b81526004016104db9190611e84565b82805461185390612040565b90600052602060002090601f01602090048101928261187557600085556118bb565b82601f1061188e57805160ff19168380011785556118bb565b828001600101855582156118bb579182015b828111156118bb5782518255916020019190600101906118a0565b506118c7929150611964565b5090565b50805460008255906000526020600020908101906114ea9190611979565b8280546118f590612040565b90600052602060002090601f01602090048101928261191757600085556118bb565b82601f1061192857805485556118bb565b828001600101855582156118bb57600052602060002091601f016020900482015b828111156118bb578254825591600101919060010190611949565b5b808211156118c75760008155600101611965565b808211156118c757600061198d8282611996565b50600101611979565b5080546119a290612040565b6000825580601f106119b2575050565b601f0160209004906000526020600020908101906114ea9190611964565b80356001600160a01b03811681146119e757600080fd5b919050565b600082601f8301126119fd57600080fd5b8135611a10611a0b82611fbd565b611f8c565b818152846020838601011115611a2557600080fd5b816020850160208301376000918101602001919091529392505050565b600060208284031215611a5457600080fd5b61156a826119d0565b60006020808385031215611a7057600080fd5b823567ffffffffffffffff80821115611a8857600080fd5b818501915085601f830112611a9c57600080fd5b813581811115611aae57611aae6120c2565b8060051b9150611abf848301611f8c565b8181528481019084860184860187018a1015611ada57600080fd5b600095505b83861015611b0457611af0816119d0565b835260019590950194918601918601611adf565b5098975050505050505050565b600060208284031215611b2357600080fd5b8151801515811461156a57600080fd5b600060208284031215611b4557600080fd5b813567ffffffffffffffff811115611b5c57600080fd5b6116de848285016119ec565b600060208284031215611b7a57600080fd5b5035919050565b60008060408385031215611b9457600080fd5b82359150602083013567ffffffffffffffff811115611bb257600080fd5b611bbe858286016119ec565b9150509250929050565b60008060408385031215611bdb57600080fd5b82519150602083015167ffffffffffffffff811115611bf957600080fd5b8301601f81018513611c0a57600080fd5b8051611c18611a0b82611fbd565b818152866020838501011115611c2d57600080fd5b611c3e826020830160208601612014565b8093505050509250929050565b60008060408385031215611c5e57600080fd5b50508035926020909101359150565b60008151808452611c85816020860160208601612014565b601f01601f19169290920160200192915050565b60008251611cab818460208701612014565b9190910192915050565b60018060a01b0384168152826020820152606060408201526000611cdc6060830184611c6d565b95945050505050565b6020808252825182820181905260009190848201906040850190845b81811015611d265783516001600160a01b031683529284019291840191600101611d01565b50909695505050505050565b6000602080830181845280855180835260408601915060408160051b870101925083870160005b82811015611d8757603f19888603018452611d75858351611c6d565b94509285019290850190600101611d59565b5092979650505050505050565b6000602080830181845280855480835260408601915060408160051b87010192506000878152848120815b83811015611e7657888603603f1901855281548390600181811c9080831680611de957607f831692505b8b8310811415611e0757634e487b7160e01b88526022600452602488fd5b828b5260208b01818015611e225760018114611e3357611e5d565b60ff19861682528d82019650611e5d565b6000898152602090208a5b86811015611e5757815484820152908501908f01611e3e565b83019750505b50949a5050978a01979490940193505050600101611dbf565b509398975050505050505050565b60208152600061156a6020830184611c6d565b60208082526021908201527f596f7572206164647265737320686173206265656e20626c61636b6c697374656040820152601960fa1b606082015260800190565b6020808252818101527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572604082015260600190565b6020808252601790820152762cb7ba93b932903737ba1039bcb9ba32b69020b236b4b760491b604082015260600190565b6020808252818101527f596f75277265206e6f74206d656d62657273206f6620746869732067726f7570604082015260600190565b8281526040602082015260006116de6040830184611c6d565b604051601f8201601f1916810167ffffffffffffffff81118282101715611fb557611fb56120c2565b604052919050565b600067ffffffffffffffff821115611fd757611fd76120c2565b50601f01601f191660200190565b60008219821115611ff857611ff8612096565b500190565b60008282101561200f5761200f612096565b500390565b60005b8381101561202f578181015183820152602001612017565b838111156115585750506000910152565b600181811c9082168061205457607f821691505b6020821081141561207557634e487b7160e01b600052602260045260246000fd5b50919050565b600060001982141561208f5761208f612096565b5060010190565b634e487b7160e01b600052601160045260246000fd5b634e487b7160e01b600052603260045260246000fd5b634e487b7160e01b600052604160045260246000fdfea264697066735822122074207126b961900778635bde99c406bf90de6090a6071e919fb3362051bbeef764736f6c63430008060033',
  ConversionRate: 10e18,
};