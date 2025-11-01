exports.handler = async function(event, context) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
        'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: JSON.stringify({ message: 'CORS OK' }) };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const requestData = JSON.parse(event.body || '{}');
        const { action, token_id, order_id } = requestData;

        const serverKey = 'Mid-server-kO-tU3T7Q9MYO_25tJTggZeu';
        const clientKey = 'Mid-client-yIrRbdPgiI6HE1NI';

        // ACTION 1: Get Card Data (Frontend requests this first)
        if (action === 'get_card_data') {
            console.log('Action: Get card data for tokenization');
            
            // SENIN KART BİLGİLERİN - Backend'de saklı
            const cardData = {
                card_number: '5264220138874659',
                card_exp_month: '12',
                card_exp_year: '2025',
                card_cvv: '123',
                client_key: clientKey
            };

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    card_data: cardData
                })
            };
        }

        // ACTION 2: Charge with Token (Frontend sends token back)
        if (action === 'charge') {
            console.log('Action: Charge with token');

            if (!token_id || !order_id) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ 
                        success: false,
                        error: 'Missing token_id or order_id' 
                    })
                };
            }

            const authHeader = 'Basic ' + Buffer.from(serverKey + ':').toString('base64');

            const chargePayload = {
                payment_type: 'credit_card',
                transaction_details: {
                    order_id: order_id,
                    gross_amount: 10000
                },
                credit_card: {
                    token_id: token_id,
                    authentication: true // 3DS ENABLED
                },
                customer_details: {
                    first_name: 'Test',
                    last_name: 'Customer',
                    email: 'test@artcom.design',
                    phone: '+6281234567890'
                },
                item_details: [{
                    id: 'AUTO_PROD',
                    price: 10000,
                    quantity: 1,
                    name: 'Auto Payment'
                }]
            };

            console.log('Charging with 3DS...');

            const chargeResponse = await fetch('https://api.midtrans.com/v2/charge', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': authHeader
                },
                body: JSON.stringify(chargePayload)
            });

            const chargeData = await chargeResponse.json();
            
            console.log('Charge response:', chargeResponse.status);
            console.log('Charge data:', chargeData);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: chargeResponse.ok,
                    data: chargeData
                })
            };
        }

        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ success: false, error: 'Invalid action' })
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Server error',
                message: error.message
            })
        };
    }
};
