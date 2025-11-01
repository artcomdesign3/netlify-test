exports.handler = async function(event, context) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
        'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json'
    };

    console.log('Function called:', event.httpMethod);

    if (event.httpMethod === 'OPTIONS') {
        return { 
            statusCode: 200, 
            headers,
            body: JSON.stringify({ message: 'CORS OK' })
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const requestData = JSON.parse(event.body || '{}');
        const { 
            card_number,
            card_exp_month,
            card_exp_year,
            card_cvv,
            amount,
            order_id,
            customer_name = 'Test Customer',
            customer_email = 'test@artcom.design',
            customer_phone = '+6281234567890'
        } = requestData;

        console.log('Payment request:', { amount, order_id });

        if (!card_number || !card_exp_month || !card_exp_year || !card_cvv) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false,
                    error: 'Missing card details' 
                })
            };
        }

        if (!amount || !order_id) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false,
                    error: 'Missing amount or order_id' 
                })
            };
        }

        const serverKey = 'Mid-server-kO-tU3T7Q9MYO_25tJTggZeu';
        const clientKey = 'Mid-client-yIrRbdPgiI6HE1NI';
        const authHeader = 'Basic ' + Buffer.from(serverKey + ':').toString('base64');

        // STEP 1: GET CARD TOKEN
        console.log('Step 1: Getting card token from Midtrans...');
        
        const tokenPayload = {
            card_number: card_number,
            card_exp_month: card_exp_month,
            card_exp_year: card_exp_year,
            card_cvv: card_cvv,
            client_key: clientKey
        };

        const tokenResponse = await fetch('https://api.midtrans.com/v2/token', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(tokenPayload)
        });

        const tokenData = await tokenResponse.json();
        console.log('Token response status:', tokenResponse.status);
        console.log('Token data:', tokenData);

        if (!tokenData.token_id) {
            console.error('Failed to get token:', tokenData);
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Failed to tokenize card',
                    details: tokenData
                })
            };
        }

        const token_id = tokenData.token_id;
        console.log('Token obtained successfully:', token_id);

        // STEP 2: CHARGE WITH TOKEN (3DS ENABLED)
        console.log('Step 2: Charging with token and 3DS authentication...');

        const chargePayload = {
            payment_type: 'credit_card',
            transaction_details: {
                order_id: order_id,
                gross_amount: parseInt(amount)
            },
            credit_card: {
                token_id: token_id,
                authentication: true
            },
            customer_details: {
                first_name: customer_name.split(' ')[0] || 'Test',
                last_name: customer_name.split(' ').slice(1).join(' ') || 'Customer',
                email: customer_email,
                phone: customer_phone
            },
            item_details: [{
                id: 'PROD_TEST',
                price: parseInt(amount),
                quantity: 1,
                name: 'Production Test Payment'
            }]
        };

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
        
        console.log('Charge response status:', chargeResponse.status);
        console.log('Charge data:', chargeData);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: chargeResponse.ok,
                data: chargeData,
                order_id: order_id,
                amount: amount,
                timestamp: Math.floor(Date.now() / 1000)
            })
        };

    } catch (error) {
        console.error('Payment error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Payment processing failed',
                message: error.message
            })
        };
    }
};
