<template>
	<view class="container">
		<view class="header">
			<view class="icon-box">👷</view>
			<view class="title">上门人登记</view>
			<view class="desc">加入“喂了么”，开启您的宠物服务之旅</view>
		</view>

		<view class="info-card">
			<view class="info-title">定位授权</view>
			<view class="info-desc">我们需要您的位置信息来推送附近的订单。请确保手机GPS已开启并授权位置权限。</view>
		</view>

		<view class="form-group">
			<view class="label">我的常驻位置</view>
			<view class="address-box" @tap="chooseLocation" :class="{active: address}">
				<view class="address-content">
					<text class="addr-icon">📍</text>
					<text class="address-text">{{address || '点击获取/选择您的当前位置'}}</text>
				</view>
				<text class="arrow">定位 ></text>
			</view>
		</view>

		<view class="action-section">
			<button class="submit-btn" @tap="register">完成登记并开启接单</button>
			<view class="terms">登记即表示同意《上门人服务协议》</view>
		</view>
	</view>
</template>

<script>
	import { useApi } from '@/utils/config.js';
	import { registerWorker } from '@/utils/api.js';

	export default {
		data() {
			return {
				address: '',
				latitude: '',
				longitude: ''
			}
		},
		methods: {
			chooseLocation() {
				uni.chooseLocation({
					success: (res) => {
						this.address = res.name || res.address;
						this.latitude = res.latitude;
						this.longitude = res.longitude;
					},
					fail: () => {
						uni.getLocation({
							type: 'gcj02',
							success: (res) => {
								this.latitude = res.latitude;
								this.longitude = res.longitude;
								this.address = '当前定位位置';
							}
						});
					}
				});
			},
			register() {
				if (!this.latitude) {
					uni.showToast({ title: '请先完成定位', icon: 'none' });
					return;
				}

				if (useApi()) {
					uni.showLoading({ title: '登记中...' });
					registerWorker({
						address: this.address,
						latitude: this.latitude,
						longitude: this.longitude
					}).then(worker => {
						const workerInfo = {
							id: worker.id,
							address: worker.address,
							latitude: worker.latitude,
							longitude: worker.longitude,
							lastUpdateTime: worker.lastUpdateTime
						};
						uni.setStorageSync('worker_info', workerInfo);
						uni.hideLoading();
						uni.showToast({ title: '登记成功' });
						setTimeout(() => uni.redirectTo({ url: '/pages/worker/orders' }), 1500);
					}).catch(err => {
						uni.hideLoading();
						uni.showToast({ title: err.message || '登记失败', icon: 'none' });
					});
					return;
				}

				const workerInfo = {
					address: this.address,
					latitude: this.latitude,
					longitude: this.longitude,
					lastUpdateTime: new Date().getTime()
				};
				uni.setStorageSync('worker_info', workerInfo);
				uni.showToast({
					title: '登记成功',
					success: () => {
						setTimeout(() => uni.redirectTo({ url: '/pages/worker/orders' }), 1500);
					}
				});
			}
		}
	}
</script>

<style>
	.container {
		padding: 60rpx 40rpx;
		background-color: #f8f9fa;
		min-height: 100vh;
	}

	.header {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: 60rpx;
	}

	.icon-box {
		font-size: 100rpx;
		margin-bottom: 20rpx;
	}

	.title {
		font-size: 40rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 12rpx;
	}

	.desc {
		font-size: 26rpx;
		color: #999;
	}

	.info-card {
		background: linear-gradient(135deg, #fff9e1, #fff3e0);
		padding: 30rpx 40rpx;
		border-radius: 24rpx;
		margin-bottom: 50rpx;
		border: 1rpx solid #ffe0b2;
	}

	.info-title {
		font-size: 30rpx;
		font-weight: bold;
		color: #f57c00;
		margin-bottom: 8rpx;
	}

	.info-desc {
		font-size: 24rpx;
		color: #fb8c00;
		line-height: 1.5;
	}

	.form-group {
		margin-bottom: 60rpx;
	}

	.label {
		font-size: 28rpx;
		font-weight: bold;
		color: #444;
		margin-bottom: 20rpx;
	}

	.address-box {
		background-color: #fff;
		padding: 34rpx 30rpx;
		border-radius: 24rpx;
		display: flex;
		justify-content: space-between;
		align-items: center;
		box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.03);
		border: 1rpx solid #eee;
	}

	.address-box.active {
		border-color: #ffca28;
	}

	.address-content {
		display: flex;
		align-items: center;
		flex: 1;
		margin-right: 20rpx;
	}

	.addr-icon {
		margin-right: 12rpx;
	}

	.address-text {
		font-size: 28rpx;
		color: #333;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.arrow {
		font-size: 24rpx;
		color: #ff9800;
		font-weight: bold;
	}

	.action-section {
		margin-top: 80rpx;
	}

	.submit-btn {
		background: linear-gradient(135deg, #ffca28, #ff9800);
		color: #fff;
		font-weight: bold;
		border-radius: 50rpx;
		font-size: 32rpx;
		box-shadow: 0 10rpx 20rpx rgba(255, 152, 0, 0.2);
		margin-bottom: 30rpx;
	}

	.terms {
		text-align: center;
		font-size: 22rpx;
		color: #bbb;
	}
</style>
