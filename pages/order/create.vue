<template>
	<view class="container">
		<view class="form-card">
			<view class="form-title">{{userRole === 'worker' ? '创建服务订单' : '填写预约信息'}}</view>

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
					<text>{{userRole === 'worker' ? '客户微信号' : '联系微信号'}}</text>
				</view>
				<view class="wechat-container">
					<view class="wechat-display" @tap="showWechatPicker">
						<text class="wechat-text">{{currentWechatName || (wechatId || (userRole === 'worker' ? '请输入客户微信号' : '请选择您的微信号'))}}</text>
						<text class="arrow">{{currentWechatName ? '>' : '▼'}}</text>
					</view>
					<view class="wechat-actions" v-if="userRole !== 'worker'">
						<text class="wechat-btn" @tap="getWechatUser">获取当前微信</text>
					</view>
				</view>
			</view>

			<!-- 备注信息已存在，删除后面多余的判断块 -->

			<view class="form-group">
				<view class="label">
					<text class="label-icon">📝</text>
					<text>备注信息</text>
				</view>
				<textarea class="textarea" v-model="remark" placeholder="请告知宠物习性、钥匙存放位置等..." placeholder-class="placeholder" />
			</view>
		</view>

		<!-- 微信选择器 -->
		<view class="wechat-picker" v-if="wechatPickerVisible">
			<view class="picker-mask" @tap="wechatPickerVisible = false"></view>
			<view class="picker-content">
				<view class="picker-header">
					<text class="picker-title">选择微信号</text>
					<text class="picker-close" @tap="wechatPickerVisible = false">×</text>
				</view>

				<view class="picker-search">
					<input class="search-input" v-model="wechatSearch" placeholder="搜索微信号" />
				</view>

				<view class="picker-body">
					<view class="wechat-list">
						<view class="wechat-item" v-for="item in filteredWechatHistory" :key="item.id" @tap="selectWechat(item)">
							<image class="wechat-avatar" :src="item.avatar || '/static/default-avatar.png'" />
							<view class="wechat-info">
								<text class="wechat-name">{{item.name}}</text>
								<text class="wechat-id">{{item.wechatId}}</text>
							</view>
							<text class="wechat-arrow">></text>
						</view>

						<view class="add-wechat-btn" @tap="getWechatUser">
							<text class="add-icon">+</text>
							<text class="add-text">获取当前微信</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<view class="bottom-bar">
			<button class="submit-btn" @tap="submitOrder">{{userRole === 'worker' ? '创建订单' : '立即预约服务'}}</button>
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
				currentWechatName: '',
				currentWechatAvatar: '',
				wechatPickerVisible: false,
				wechatHistory: [],
				wechatSearch: '',
				userRole: ''
			}
		},
		onLoad() {
			this.initUserRole();
			this.loadWechatHistory();
			this.initWechatInfo();
		},
		onShow() {
			this.initUserRole();
			if (!this.wechatId) {
				this.wechatId = uni.getStorageSync('my_wechat_id') || '';
				if (this.wechatId) {
					this.getWechatUserInfo(this.wechatId);
				}
			}
		},
		computed: {
			filteredWechatHistory() {
				if (!this.wechatSearch) {
					return this.wechatHistory;
				}
        debugger
				const search = this.wechatSearch.toLowerCase();
				return this.wechatHistory.filter(item =>
					item.name.toLowerCase().includes(search) ||
					item.wechatId.toLowerCase().includes(search)
				);
			}
		},
		methods: {
			initUserRole() {
				this.userRole = uni.getStorageSync('user_role') || '';
			},

			initWechatInfo() {
				// 获取微信环境信息
				try {
					const systemInfo = uni.getSystemInfoSync();
					// 真机调试环境下 appName 可能不准，补充 platform 判断
					this.isMiniProgram =
						systemInfo.app === 'tools' ||
						systemInfo.appName === '微信小程序' ||
						systemInfo.platform === 'devtools' ||
						(systemInfo.uniPlatform === 'mp-weixin');
				} catch (e) {
					this.isMiniProgram = false;
				}

				// 兜底：如果是在微信环境中，强制设为 true
				// #ifdef MP-WEIXIN
				this.isMiniProgram = true;
				// #endif
			},

			loadWechatHistory() {
				this.wechatHistory = uni.getStorageSync('wechat_history') || [];
			},

			saveWechatHistory(wechatInfo) {
				let history = uni.getStorageSync('wechat_history') || [];
				const index = history.findIndex(item => item.id === wechatInfo.id);

				if (index >= 0) {
					history[index] = wechatInfo;
				} else {
					history.unshift(wechatInfo);
				}

				// 只保留最近10个
				if (history.length > 10) {
					history = history.slice(0, 10);
				}

				uni.setStorageSync('wechat_history', history);
				this.wechatHistory = history;
			},

			getWechatUser() {
				if (!this.isMiniProgram) {
					uni.showModal({
						title: '提示',
						content: '请在微信小程序中使用此功能',
						showCancel: false
					});
					return;
				}

				uni.showLoading({ title: '获取中...' });

				// 使用 uni.getUserProfile 替代微信原生 wx.getUserProfile
				uni.getUserProfile({
					desc: '用于下单时自动填写信息',
					success: (res) => {
						uni.hideLoading();
            console.log(res,'@@@@@@@@@@@@@@@@@@@');
						const userInfo = res.userInfo;
						// 微信目前不再直接返回微信号，通常使用昵称作为标识或引导用户填写
						this.wechatId = userInfo.nickName;
						this.currentWechatName = userInfo.nickName;
						this.currentWechatAvatar = userInfo.avatarUrl;

						// 保存到本地历史记录，无需后端接口
						this.saveWechatHistory({
							id: Date.now(),
							name: userInfo.nickName,
							avatar: userInfo.avatarUrl,
							wechatId: userInfo.nickName,
							time: new Date().toISOString()
						});

						uni.setStorageSync('my_wechat_id', this.wechatId);
						uni.showToast({ title: '获取成功' });
					},
					fail: (err) => {
						uni.hideLoading();
						uni.showModal({
							title: '获取失败',
							content: '请手动输入微信号或在设置中授权',
							showCancel: false
						});
					}
				});
			},

			getWechatUserInfo(wechatId) {
				// 优先从本地历史记录中查找匹配的微信用户信息
				const user = this.wechatHistory.find(item => item.wechatId === wechatId);
				if (user) {
					this.currentWechatName = user.name;
					this.currentWechatAvatar = user.avatar;
				}
			},

			showWechatPicker() {
				this.wechatPickerVisible = true;
			},

			selectWechat(wechatInfo) {
				this.wechatId = wechatInfo.wechatId;
				this.currentWechatName = wechatInfo.name;
				this.currentWechatAvatar = wechatInfo.avatar;
				this.wechatPickerVisible = false;
				this.wechatSearch = '';

				uni.setStorageSync('my_wechat_id', this.wechatId);

				uni.showToast({ title: '已选择' });
			},

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

				if (this.userRole === 'worker') {
					// 上门人提交订单
					if (useApi()) {
						uni.showLoading({ title: '提交中...' });
						createOrder({
							date: this.date,
							address: this.address,
							latitude: this.latitude,
							longitude: this.longitude,
							wechatId: this.wechatId,
							remark: this.remark,
							status: 'accepted' // 上门人直接创建已接单的订单
						}).then(() => {
							uni.hideLoading();
							uni.showToast({ title: '订单创建成功' });
							setTimeout(() => uni.navigateBack(), 1500);
						}).catch(err => {
							uni.hideLoading();
							uni.showToast({ title: err.message || '提交失败', icon: 'none' });
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
						status: 'accepted' // 上门人直接创建已接单的订单
					};
					let orders = uni.getStorageSync('orders') || [];
					orders.push(order);
					uni.setStorageSync('orders', orders);
					uni.showToast({
						title: '订单创建成功',
						success: () => {
							setTimeout(() => uni.navigateBack(), 1500);
						}
					});
				} else {
					// 客户提交订单
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
					uni.setStorageSync('my_wechat_id', this.wechatId);
					uni.showToast({
						title: '下单成功',
						success: () => {
							setTimeout(() => uni.navigateBack(), 1500);
						}
					});
				}
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

	.wechat-container {
		background-color: #f5f6f7;
		border-radius: 20rpx;
		border: 1rpx solid transparent;
		transition: all 0.3s;
	}

	.wechat-container:active {
		border-color: #ffca28;
		background-color: #fff;
	}

	.wechat-display {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 24rpx 30rpx;
		font-size: 28rpx;
		color: #333;
	}

	.wechat-text {
		flex: 1;
	}

	.wechat-actions {
		padding: 0 24rpx 24rpx;
	}

	.wechat-btn {
		font-size: 24rpx;
		color: #ff9800;
		text-align: right;
	}

	.wechat-picker {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 9999;
	}

	.picker-mask {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
	}

	.picker-content {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		background-color: #fff;
		border-radius: 32rpx 32rpx 0 0;
		max-height: 80vh;
		overflow: hidden;
	}

	.picker-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 32rpx;
		border-bottom: 1rpx solid #f0f0f0;
	}

	.picker-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
	}

	.picker-close {
		font-size: 40rpx;
		color: #999;
		width: 60rpx;
		text-align: center;
	}

	.picker-search {
		padding: 24rpx 32rpx;
		border-bottom: 1rpx solid #f0f0f0;
	}

	.search-input {
		background-color: #f5f6f7;
		padding: 20rpx 24rpx;
		border-radius: 16rpx;
		font-size: 28rpx;
		color: #333;
	}

	.picker-body {
		max-height: 60vh;
		overflow-y: auto;
	}

	.wechat-list {
		padding: 0 32rpx 32rpx;
	}

	.wechat-item {
		display: flex;
		align-items: center;
		padding: 24rpx 0;
		border-bottom: 1rpx solid #f0f0f0;
	}

	.wechat-item:last-child {
		border-bottom: none;
	}

	.wechat-avatar {
		width: 80rpx;
		height: 80rpx;
		border-radius: 50%;
		margin-right: 24rpx;
		background-color: #f0f0f0;
	}

	.wechat-info {
		flex: 1;
	}

	.wechat-name {
		font-size: 28rpx;
		font-weight: 600;
		color: #333;
		margin-bottom: 8rpx;
	}

	.wechat-id {
		font-size: 24rpx;
		color: #999;
	}

	.wechat-arrow {
		font-size: 24rpx;
		color: #ccc;
	}

	.add-wechat-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 32rpx 0;
		background-color: #f5f6f7;
		border-radius: 16rpx;
		margin-top: 24rpx;
	}

	.add-icon {
		font-size: 32rpx;
		color: #ff9800;
		margin-right: 12rpx;
	}

	.add-text {
		font-size: 28rpx;
		color: #666;
	}
</style>
