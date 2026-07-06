export const shortenAddress = (address: string, chars = 4) => {
    if (!address || address.length < chars * 2 + 2) {
        return address;
    }
    return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
};