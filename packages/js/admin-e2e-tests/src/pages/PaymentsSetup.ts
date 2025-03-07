/**
 * Internal dependencies
 */
import { waitForElementByText, getElementByText } from '../utils/actions';
import { BasePage } from './BasePage';

type PaymentMethodWithSetupButton =
	| 'wcpay'
	| 'stripe'
	| 'paypal'
	| 'klarna_payments'
	| 'mollie'
	| 'bacs';

type PaymentMethod = PaymentMethodWithSetupButton | 'cod';

export class PaymentsSetup extends BasePage {
	url = 'wp-admin/admin.php?page=wc-admin&task=payments';

	async isDisplayed(): Promise< void > {
		await waitForElementByText( 'h1', 'Set up payments' );
	}

	async possiblyCloseHelpModal(): Promise< void > {
		try {
			await this.clickButtonWithText( 'Got it' );
		} catch ( e ) {}
	}

	async showOtherPaymentMethods(): Promise< void > {
		const selector = '.woocommerce-task-payments button.toggle-button';
		await this.page.waitForSelector( selector );
		const toggleButton = await this.page.$(
			`${ selector }[aria-expanded=false]`
		);
		await toggleButton?.click();
		await waitForElementByText( 'h2', 'Offline payment methods' );
	}

	async goToPaymentMethodSetup(
		method: PaymentMethodWithSetupButton
	): Promise< void > {
		const selector = `.woocommerce-task-payment-${ method } button`;
		await this.page.waitForSelector( selector );
		const button = await this.page.$( selector );

		if ( ! button ) {
			throw new Error(
				`Could not find button with selector: ${ selector }`
			);
		} else {
			await button.click();
		}
	}

	async enableCashOnDelivery(): Promise< void > {
		await this.page.waitForSelector( '.woocommerce-task-payment-cod' );
		await this.clickButtonWithText( 'Enable' );
	}
}
