const conn = require('./database');

class GenericDao {

    constructor(tabela) {
        this.tabela = tabela;
    }

    deleteById(id) {
        return this.query(`
            DELETE 
            FROM ${this.tabela} 
            WHERE id_${this.tabela} = $1
        `, [id]);
    }

    /**
     * options {
     *  order: string,
     *  limit: number,
     * }
     * @param {*} options 
     */
    findAll(options) {
        options = options == undefined ? {} : options
        return this.queryFindAll(`
            SELECT * 
            FROM ${this.tabela}
            ${this._addOnScript('ORDER BY', options.order)}
            ${this._addOnScript('LIMIT', options.limit)}`);
    }

    findById(id, _transaction) {
        return this.queryFindOne(
            `SELECT * 
            FROM ${this.tabela}
            WHERE id_${this.tabela} = $1`, [id], _transaction);
    }

    _addOnScript(preText, value) {
        if (value !== undefined && value != null) {
            return `${preText} ${value}`;
        }
        return '';
    }

    query = (sql, values, _transaction) => conn.query(sql, values, _transaction);
    queryFindOne = (sql, values, _transaction) => conn.findOne(sql, values, _transaction);
    queryFindAll = (sql, values, _transaction) => conn.findAll(sql, values, _transaction);
    insertWithReturn = (sql, values, columnReturn, _transaction) => conn.insertWithReturn(sql, values, columnReturn, _transaction);

}

module.exports = GenericDao;