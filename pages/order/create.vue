<template>
	<view class="container">
		<view class="form-card">
			<view class="form-title">填写预约信息</view>

			<view class="form-group">
				<view class="label">
					<text class="label-icon">📅</text>
					<text>上门日期</text>
				</view>
				<picker mode="date" :value="date" @change="bindDateChange">
					<view class="picker-input" :class="{placeholder: !date}">
						{{date || '请选择预约上门日期'}}
					</view>
				</picker>
			</view>

			<view class="form-group">
				<view class="label">
					<text class="label-icon">📍</text>
					<text>详细地址</text>
				</view>
				<view class="address-box" @tap="chooseLocation" :class="{placeholder: !address}">
					<text class="address-text">{{address || '点击选择上门服务地址'}}</text>
					<text class="arrow">></text>
				</view>
			</view>

			<view class="form-group">
				<view class="label">
					<text class="label-icon">💬</text>
					<text>联系微信号</text>
				</view>
				<input class="input" v-model="wechatId" placeholder="请输入您的微信号" placeholder-class="placeholder" />
			</view>

			<view class="form-group">
				<view class="label">
					<text class="label-icon">📝</text>
					<text>备注信息</text>
				</view>
				<textarea class="textarea" v-model="remark" placeholder="请告知宠物习性、钥匙存放位置等..." placeholder-class="placeholder" />
			</view>
		</view>

		<view class="bottom-bar">
			<button class="submit-btn" @tap="submitOrder">立即预约服务</button>
		</view>
	</view>
</template>

<script>
	import { useApi } from '@/utils/config.js';
	import { createOrder } from '@/utils/api.js';

	export default {
		data() {
			return {
				date: '',
				address: '',
				latitude: '',
				longitude: '',
				wechatId: '',
				remark: ''
			}
		},
		methods: {
			bindDateChange(e) {
				this.date = e.detail.value
			},
			chooseLocation() {
				uni.chooseLocation({
					success: (res) => {
						this.address = res.address + ' ' + res.name;
						this.latitude = res.latitude;
						this.longitude = res.longitude;
					}
				})
			},
			submitOrder() {
				if (!this.date || !this.address || !this.wechatId) {
					uni.showToast({
						title: '请填写完整信息',
						icon: 'none'
					});
					return;
				}

				if (useApi()) {
					uni.showLoading({ title: '提交中...' });
					createOrder({
						date: this.date,
						address: this.address,
						latitude: this.latitude,
						longitude: this.longitude,
						wechatId: this.wechatId,
						remark: this.remark
					}).then(() => {
						uni.setStorageSync('my_wechat_id', this.wechatId);
						uni.hideLoading();
						uni.showToast({ title: '下单成功' });
						setTimeout(() => uni.navigateBack(), 1500);
					}).catch(err => {
						uni.hideLoading();
						uni.showToast({ title: err.message || '下单失败', icon: 'none' });
					});
					return;
				}

				const order = {
					id: Date.now(),
					date: this.date,
					address: this.address,
					latitude: this.latitude,
					longitude: this.longitude,
					wechatId: this.wechatId,
					remark: this.remark,
					status: 'pending'
				};
				let orders = uni.getStorageSync('orders') || [];
				orders.push(order);
				uni.setStorageSync('orders', orders);
				uni.showToast({
					title: '下单成功',
					success: () => {
						setTimeout(() => uni.navigateBack(), 1500);
					}
				});
			}
		}
	}
</script>

<style>
	.container {
		padding: 30rpx;
		background-color: #f8f9fa;
		min-height: 100vh;
		padding-bottom: 120rpx;
	}

	.form-card {
		background-color: #fff;
		border-radius: 32rpx;
		padding: 40rpx;
		box-shadow: 0 10rpx 40rpx rgba(0,0,0,0.03);
	}

	.form-title {
		font-size: 34rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 40rpx;
		padding-left: 20rpx;
		border-left: 8rpx solid #ffca28;
	}

	.form-group {
		margin-bottom: 40rpx;
	}

	.label {
		font-size: 28rpx;
		font-weight: 600;
		color: #444;
		margin-bottom: 16rpx;
		display: flex;
		align-items: center;
	}

	.label-icon {
		margin-right: 12rpx;
		font-size: 32rpx;
	}

	.picker-input, .input, .address-box {
		background-color: #f5f6f7;
		padding: 24rpx 30rpx;
		border-radius: 20rpx;
		font-size: 28rpx;
		color: #333;
		border: 1rpx solid transparent;
		transition: all 0.3s;
	}

	.picker-input:active, .input:focus, .address-box:active {
		border-color: #ffca28;
		background-color: #fff;
	}

	.placeholder {
		color: #999;
	}

	.address-box {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.arrow {
		color: #ccc;
		font-size: 24rpx;
	}

	.textarea {
		background-color: #f5f6f7;
		padding: 24rpx 30rpx;
		border-radius: 20rpx;
		font-size: 28rpx;
		width: 100%;
		box-sizing: border-box;
		height: 200rpx;
		color: #333;
	}

	.bottom-bar {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 20rpx 40rpx;
		background-color: #fff;
		box-shadow: 0 -10rpx 30rpx rgba(0,0,0,0.05);
	}

	.submit-btn {
		background: linear-gradient(135deg, #ffca28, #ff9800);
		color: #fff;
		font-weight: bold;
		border-radius: 50rpx;
		font-size: 32rpx;
		border: none;
		box-shadow: 0 10rpx 20rpx rgba(255, 152, 0, 0.3);
	}

	.submit-btn:active {
		opacity: 0.9;
		transform: scale(0.98);
	}
</style>
