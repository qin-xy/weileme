<template>
	<view class="container">
		<view class="order-info">
			<view class="title">正在为 {{order.wechatId}} 服务</view>
			<view class="address">{{order.address}}</view>
		</view>

		<view class="upload-section">
			<view class="section-title">上传现场图片/视频</view>
			<view class="media-grid">
				<view class="media-item" v-for="(item, index) in mediaList" :key="index">
					<image v-if="item.type === 'image'" :src="item.url" mode="aspectFill" @tap="previewImage(index)"></image>
					<video v-if="item.type === 'video'" :src="item.url" :controls="false"></video>
					<view class="delete-btn" @tap="deleteMedia(index)">×</view>
				</view>
				<view class="add-btn" @tap="showActionSheet">+</view>
			</view>
		</view>

		<view class="tips">
			<text>温馨提示：上传成功后，系统将自动同步发送至客户微信（{{order.wechatId}}）</text>
		</view>

		<button class="submit-btn" :disabled="mediaList.length === 0" type="primary" @tap="submitService">完成服务并发送</button>
	</view>
</template>

<script>
	import { useApi } from '@/utils/config.js';
	import { getOrderById, uploadOrderMedia, completeOrder } from '@/utils/api.js';

	export default {
		data() {
			return {
				orderId: null,
				order: {},
				mediaList: []
			}
		},
		onLoad(options) {
			this.orderId = options.orderId;
			this.loadOrder();
		},
		methods: {
			loadOrder() {
				if (useApi()) {
					getOrderById(this.orderId).then(o => { this.order = o || {}; }).catch(() => { this.order = {}; });
				} else {
					const allOrders = uni.getStorageSync('orders') || [];
					this.order = allOrders.find(o => o.id == this.orderId) || {};
				}
			},
			showActionSheet() {
				uni.showActionSheet({
					itemList: ['拍摄图片', '拍摄视频', '从相册选择'],
					success: (res) => {
						if (res.tapIndex === 0) this.chooseMedia(['camera'], ['image']);
						else if (res.tapIndex === 1) this.chooseMedia(['camera'], ['video']);
						else this.chooseMedia(['album'], ['image', 'video']);
					}
				});
			},
			chooseMedia(sourceType, mediaType) {
				uni.chooseMedia({
					count: 9,
					mediaType: mediaType,
					sourceType: sourceType,
					success: (res) => {
						res.tempFiles.forEach(file => {
							this.mediaList.push({
								url: file.tempFilePath,
								type: file.fileType || (file.tempFilePath.match(/\.(mp4|mov|avi)$/i) ? 'video' : 'image'),
								_local: true
							});
						});
					}
				});
			},
			deleteMedia(index) {
				this.mediaList.splice(index, 1);
			},
			previewImage(index) {
				const urls = this.mediaList.filter(m => m.type === 'image').map(m => m.url);
				uni.previewImage({ current: this.mediaList[index].url, urls });
			},
			submitService() {
				uni.showLoading({ title: '正在提交...' });

				if (useApi()) {
					const localFiles = this.mediaList.filter(m => m._local);
					const uploaded = this.mediaList.filter(m => !m._local);
					Promise.all(localFiles.map(m => uploadOrderMedia(this.orderId, m.url, m.type)))
						.then(results => {
							const media = [...uploaded.map(m => ({ url: m.url, type: m.type })), ...results];
							return completeOrder(this.orderId, media);
						})
						.then(() => {
							uni.hideLoading();
							uni.showModal({
								title: '服务已完成',
								content: `已同步至客户微信号: ${this.order.wechatId}`,
								showCancel: false,
								success: () => uni.navigateBack()
							});
						})
						.catch(err => {
							uni.hideLoading();
							uni.showToast({ title: err.message || '提交失败', icon: 'none' });
						});
					return;
				}

				setTimeout(() => {
					let allOrders = uni.getStorageSync('orders') || [];
					const idx = allOrders.findIndex(o => o.id == this.orderId);
					if (idx > -1) {
						allOrders[idx].status = 'completed';
						allOrders[idx].serviceMedia = this.mediaList;
						uni.setStorageSync('orders', allOrders);
					}
					uni.hideLoading();
					uni.showModal({
						title: '服务已完成',
						content: `已成功同步至客户微信号: ${this.order.wechatId}`,
						showCancel: false,
						success: () => uni.navigateBack()
					});
				}, 2000);
			}
		}
	}
</script>

<style>
	.container {
		padding: 30rpx;
		background-color: #fff;
	}
	.order-info {
		padding: 30rpx;
		background-color: #f8f8f8;
		border-radius: 12rpx;
		margin-bottom: 40rpx;
	}
	.order-info .title {
		font-size: 32rpx;
		font-weight: bold;
		margin-bottom: 10rpx;
	}
	.order-info .address {
		font-size: 26rpx;
		color: #666;
	}
	.section-title {
		font-size: 30rpx;
		font-weight: bold;
		margin-bottom: 20rpx;
	}
	.media-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 20rpx;
		margin-bottom: 40rpx;
	}
	.media-item, .add-btn {
		aspect-ratio: 1;
		background-color: #eee;
		border-radius: 8rpx;
		position: relative;
		overflow: hidden;
	}
	.media-item image, .media-item video {
		width: 100%;
		height: 100%;
	}
	.add-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 60rpx;
		color: #999;
		border: 2rpx dashed #ccc;
	}
	.delete-btn {
		position: absolute;
		top: 0;
		right: 0;
		background-color: rgba(0,0,0,0.5);
		color: #fff;
		padding: 0 10rpx;
		font-size: 24rpx;
	}
	.tips {
		font-size: 24rpx;
		color: #ff9800;
		background-color: #fff3e0;
		padding: 20rpx;
		border-radius: 8rpx;
		margin-bottom: 60rpx;
	}
	.submit-btn {
		background-color: #4caf50;
	}
</style>
