export default class SizedAddress  {

    constructor(address, size) {
        this.address = address;
        this.size = size;
    }

    getAddress() {
        return this.address;
    }

    getSize() {
        return this.size;
    }

equals( o) {
        if (this == o) return true;
        if (o == null || o == undefined) return false;

        let that =o;

        if (address != that.address) return false;
        if (size != that.size) return false;

        return true;
    }

   hashCode() {
        let result = address;
        result = 31 * result + size;
        return result;
    }

    toString() {
        return "SizedAddress{" +
                "address=" + (address).toString(16) +
                ", size=" + (size).toString(16) +
                '}';
    }
    compareTo( o) {
        let compare = this.getAddress().localeCompare(o.getAddress());
        return (compare == 0) ? this.getSize().localeCompare(o.getSize()) : compare;
    }
}