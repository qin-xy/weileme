<template>
	<view class="container">
		<view class="tabs">
			<view class="tab" :class="{active: activeTab === 0}" @tap="activeTab = 0">待接单</view>
			<view class="tab" :class="{active: activeTab === 1}" @tap="activeTab = 1">我的任务</view>
		</view>

		<view v-if="activeTab === 0" class="order-list">
			<view v-for="order in pendingOrders" :key="order.id" class="order-item">
				<view class="order-header">
					<text class="date">{{order.date}}</text>
					<text class="distance">{{getDistanceLabel(order)}}</text>
				</view>
				<view class="address">{{order.address}}</view>
				<view class="remark">客户微信：{{order.customerWechatId || '未提供'}}</view>
				<view class="remark" v-if="order.remark">备注：{{order.remark}}</view>
				<view class="actions">
					<button class="action-btn secondary" size="mini" @tap="handleWechatAction(order)">
						{{isWechatAdded(order.customerWechatId) ? '去微信对话' : '添加微信'}}
					</button>
					<button class="action-btn" size="mini" @tap="acceptOrder(order)">接单</button>
				</view>
			</view>
			<view v-if="pendingOrders.length === 0" class="empty">暂无附近订单</view>
		</view>

		<view v-else class="order-list">
			<view class="route-plan" v-if="myOrders.length > 0">
				<button class="plan-btn" type="warn" size="mini" @tap="planRoute">规划今日路线</button>
			</view>
			<view v-for="order in myOrders" :key="order.id" class="order-item">
				<view class="order-header">
					<text class="date">{{order.date}}</text>
					<text class="status-tag">{{getStatusLabel(order.status)}}</text>
				</view>
				<view class="address">{{order.address}}</view>
				<view class="remark" v-if="order.customerWechatId">客户微信：{{order.customerWechatId}}</view>
				<view class="remark" v-if="order.remark">备注：{{order.remark}}</view>
				<view class="actions">
					<button class="action-btn secondary" size="mini" @tap="handleWechatAction(order)">
						{{isWechatAdded(order.customerWechatId) ? '去微信对话' : '添加微信'}}
					</button>
					<button class="action-btn secondary" size="mini" @tap="openMap(order)">导航</button>
					<button class="action-btn" size="mini" v-if="order.status === 'accepted'" @tap="goToUpload(order)">去上门</button>
				</view>
			</view>
			<view v-if="myOrders.length === 0" class="empty">还没有接单哦</view>
		</view>
	</view>
</template>

<script>
	import { useApi } from '@/utils/config.js';
	import { getOrders, acceptOrder as apiAcceptOrder } from '@/utils/api.js';

	export default {
		data() {
			return {
				activeTab: 0,
				pendingOrders: [],
				myOrders: [],
				workerInfo: null
			}
		},
		onShow() {
			this.loadData();
		},
		methods: {
			getAddedWechatIds() {
				return uni.getStorageSync('added_wechat_ids') || [];
			},
			isWechatAdded(wechatId) {
				if (!wechatId) return false;
				const list = this.getAddedWechatIds();
				return list.includes(wechatId);
			},
			markWechatAdded(wechatId) {
				if (!wechatId) return;
				const list = this.getAddedWechatIds();
				if (!list.includes(wechatId)) {
					list.push(wechatId);
					uni.setStorageSync('added_wechat_ids', list);
				}
			},
			handleWechatAction(order) {
				const wechatId = order.customerWechatId || order.wechatId;
				if (!order || !wechatId) {
					uni.showToast({ title: '客户未提供微信号', icon: 'none' });
					return;
				}
				const alreadyAdded = this.isWechatAdded(wechatId);
				uni.setClipboardData({
					data: wechatId,
					success: () => {
						if (!alreadyAdded) {
							this.markWechatAdded(wechatId);
							uni.showModal({
								title: '已复制微信号',
								content: '请打开微信添加对方，已为你标记为已添加。',
								showCancel: false
							});
							return;
						}
						uni.showModal({
							title: '已复制微信号',
							content: '请打开微信与客户对话。',
							showCancel: false
						});
					}
				});
			},
			loadData() {
				this.workerInfo = uni.getStorageSync('worker_info');
				if (useApi() && this.workerInfo && this.workerInfo.id) {
					getOrders({ status: 'pending' }).then(list => { this.pendingOrders = list || []; }).catch(() => { this.pendingOrders = []; });
					getOrders({ workerId: this.workerInfo.id }).then(list => { this.myOrders = list || []; }).catch(() => { this.myOrders = []; });
				} else if (!useApi()) {
					const allOrders = uni.getStorageSync('orders') || [];
					this.pendingOrders = allOrders.filter(o => o.status === 'pending').map(o => ({ ...o, customerWechatId: o.wechatId }));
					this.myOrders = allOrders.filter(o => o.status === 'accepted' || o.status === 'completed').map(o => ({ ...o, customerWechatId: o.wechatId }));
				} else {
					this.pendingOrders = [];
					this.myOrders = [];
				}
			},
			getDistanceLabel(order) {
				if (!this.workerInfo) return '位置未知';
				const lat = order.latitude, lng = order.longitude;
				if (lat == null || lng == null) return '距离未知';
				const d = Math.sqrt(Math.pow(lat - this.workerInfo.latitude, 2) + Math.pow(lng - this.workerInfo.longitude, 2));
				return (d * 111).toFixed(1) + 'km';
			},
			acceptOrder(order) {
				if (useApi() && this.workerInfo && this.workerInfo.id) {
					apiAcceptOrder(order.id, this.workerInfo.id).then(() => {
						uni.showToast({ title: '已接单' });
						this.loadData();
					}).catch(err => uni.showToast({ title: err.message || '接单失败', icon: 'none' }));
					return;
				}
				let allOrders = uni.getStorageSync('orders') || [];
				const index = allOrders.findIndex(o => o.id === order.id);
				if (index > -1) {
					allOrders[index].status = 'accepted';
					uni.setStorageSync('orders', allOrders);
					uni.showToast({ title: '已接单' });
					this.loadData();
				}
			},
			getStatusLabel(status) {
				const map = { 'accepted': '待上门', 'completed': '已完成' };
				return map[status] || status;
			},
			openMap(order) {
				uni.openLocation({
					latitude: order.latitude,
					longitude: order.longitude,
					name: '目的地',
					address: order.address
				});
			},
			goToUpload(order) {
				uni.navigateTo({
					url: `/pages/worker/upload?orderId=${order.id}`
				});
			},
			planRoute() {
				uni.showModal({
					title: '路线规划',
					content: '系统已根据今日订单位置为您优化最优路径：\n1. A小区 -> 2. B花园 -> 3. C公寓',
					showCancel: false
				});
			}
		}
	}
</script>

<style>
	.container {
		background-color: #f8f9fa;
		min-height: 100vh;
	}
	.tabs {
		display: flex;
		background-color: #fff;
		margin-bottom: 24rpx;
		position: sticky;
		top: 0;
		z-index: 10;
		box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.02);
	}
	.tab {
		flex: 1;
		text-align: center;
		padding: 30rpx 0;
		font-size: 30rpx;
		color: #999;
		font-weight: 600;
		transition: all 0.3s;
	}
	.tab.active {
		color: #ff9800;
		position: relative;
	}
	.tab.active::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 40rpx;
		height: 6rpx;
		background: #ffca28;
		border-radius: 3rpx;
	}
	.order-list {
		padding: 24rpx;
	}
	.order-item {
		background-color: #fff;
		border-radius: 32rpx;
		padding: 32rpx;
		margin-bottom: 24rpx;
		box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.03);
	}
	.order-header {
		display: flex;
		justify-content: space-between;
		margin-bottom: 20rpx;
	}
	.date {
		font-size: 32rpx;
		font-weight: bold;
	}
	.distance, .status-tag {
		font-size: 24rpx;
		color: #ff9800;
		font-weight: 700;
		background: #fff8e1;
		padding: 4rpx 16rpx;
		border-radius: 12rpx;
	}
	.address {
		font-size: 28rpx;
		color: #333;
		margin-bottom: 20rpx;
		line-height: 1.4;
		font-weight: 500;
	}
	.remark {
		font-size: 24rpx;
		color: #888;
		margin-bottom: 12rpx;
		padding-left: 10rpx;
		border-left: 4rpx solid #eee;
	}
	.actions {
		display: flex;
		gap: 20rpx;
		margin-top: 30rpx;
	}
	.action-btn {
		flex: 1;
		background: linear-gradient(135deg, #ffca28, #ff9800);
		color: #fff;
		margin: 0;
		border-radius: 40rpx;
		font-weight: bold;
		border: none;
		box-shadow: 0 6rpx 16rpx rgba(255, 152, 0, 0.15);
	}
	.action-btn.secondary {
		background: #f5f6f7;
		color: #666;
		box-shadow: none;
	}
	.route-plan {
		margin-bottom: 20rpx;
		text-align: right;
	}
	.empty {
		text-align: center;
		padding: 100rpx 0;
		color: #ccc;
	}
</style>
