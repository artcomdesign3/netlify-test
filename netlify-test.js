// Midtrans Core API Payment Charge - Test Version
exports.handler = async function(event, context) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    console.log('🚀 CORE API PAYMENT - TEST MODE');

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
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

        console.log('💳 Card payment request:');
        console.log('Amount:', amount);
        console.log('Order ID:', order_id);
        console.log('Card:', card_number ? card_number.substring(0, 6) + '******' : 'missing');

        // Validation
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

        // Midtrans Core API - Charge Request
        const serverKey = 'Mid-server-kO-tU3T7Q9MYO_25tJTggZeu';
        const authHeader = 'Basic ' + Buffer.from(serverKey + ':').toString('base64');

        const chargePayload = {
            payment_type: 'credit_card',
            transaction_details: {
                order_id: order_id,
                gross_amount: parseInt(amount)
            },
            credit_card: {
                card_number: card_number,
                card_exp_month: card_exp_month,
                card_exp_year: card_exp_year,
                card_cvv: card_cvv,
                secure: true,
                bank: 'bni',
                save_card: false
            },
            customer_details: {
                first_name: customer_name.split(' ')[0] || 'Test',
                last_name: customer_name.split(' ').slice(1).join(' ') || 'Customer',
                email: customer_email,
                phone: customer_phone
            },
            item_details: [
                {
                    id: 'TEST_PRODUCT',
                    price: parseInt(amount),
                    quantity: 1,
                    name: 'Test Product Payment'
                }
            ]
        };

        console.log('📤 Sending charge request to Midtrans...');

        const response = await fetch('https://api.midtrans.com/v2/charge', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': authHeader
            },
            body: JSON.stringify(chargePayload)
        });

        const responseData = await response.json();
        
        console.log('📡 Midtrans response status:', response.status);
        console.log('📡 Transaction status:', responseData.transaction_status);
        console.log('📡 Fraud status:', responseData.fraud_status);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: response.ok,
                data: responseData,
                order_id: order_id,
                amount: amount,
                timestamp: Math.floor(Date.now() / 1000)
            })
        };

    } catch (error) {
        console.error('🚨 Payment error:', error);
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
