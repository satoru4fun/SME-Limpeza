
exports.isEmpty = async (value) => {
    return value == undefined || value == null || !value.toString().trim().length; 
};

exports.toUpper = async (value) => {
    if (await this.isEmpty(value)) return value;
    return value.toString().toUpperCase();
};

exports.coalesce = async (value, valueOr) => {
    return await this.isEmpty(value) ? valueOr : value; 
};

exports.getDatatableParams = async (req) => {
    let params = req.query;
    if (! await this.isEmpty(params.filters)) {
        params.filters = JSON.parse(params.filters);
    }
    return params;
};

exports.isTrue = async (value) => {
    if (await this.isEmpty(value)) {
        return false;
    }
    return value == true;
};

exports.isAllEmpty = async (arr = []) => {
    let res = true;
    arr.forEach(async (value) => {
        if (! await this.isEmpty(value)) {
            res = false;
        }
    });
    return res;
};