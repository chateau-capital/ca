import "@quadrata/contracts/interfaces/IQuadReader.sol";
import "@quadrata/contracts/interfaces/IQuadPassportStore.sol";
import "@quadrata/contracts/utility/QuadReaderUtils.sol";

contract NotAmerica {
    using QuadReaderUtils for bytes32;
    IQuadReader public immutable reader;
    
    constructor(address _reader) {
        reader = IQuadReader(_reader);
    }

    modifier NOT_AMERICAN() {
        IQuadPassportStore.Attribute[] memory attributes = reader.getAttributes(
            msg.sender, 
            keccak256("COUNTRY")
        );

        require(attributes.length > 0, "REQUIRES_COUNTRY");
        
        // only users residing outside the US may borrow money        
        require(!attributes[0].value.countryIsEqual("US"), "AMERICAN");
        _;
    }
}