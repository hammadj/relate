import request from './request'

class Network {
    constructor() {
        this.doRequest = request;
        this.setInterface = this.setInterface.bind(this);
        this.request = this.request.bind(this);
    }

    setInterface(func) {
        this.doRequest = func;
    }

    request(params) {
        return this.doRequest(params)
    }
}

export default new Network();
