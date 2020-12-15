import rpc from './rpc'
import axios from 'axios'

export default {
    listUserTokenBalances(apiUrl, address, limit, offset) {
        return rpc.request(apiUrl, `
        query TokenExplorer($address: String!, $limit: Int, $offset: Int) {
           listUserTokenBalances(address: $address, limit: $limit, offset: $offset) {
               items {
                   id
                   contract_addr
                   token_name
                   token_symbol
                   precision
                   owner_addr
                   amount
                   created_at
                   updated_at
               }
               total
           }
        }`, {
            address,
            limit,
            offset
        })
    },
    listUserTokenBalancesFromExplorer(apiUrl, address, limit, offset) {
        let url = apiUrl
        if(address) {
            url = url + '?address=' + address
        }
        return axios.get(url).then(data => {
            return data.data
        })
    }
}
