Rails.application.routes.draw do
  post   :signup, to: "registrations#create"
  get    :signup, to: 'registrations#new'
  post   :login,  to: "sessions#create"
  delete :logout, to: "sessions#destroy"
   patch '/users/update_profile', to: 'users#update_profile'


  resources :products, only: [:create, :index, :show] do
    member do
      patch :approve_by_admin
    end
    collection do
      get :my_products
    end
  end

  resources :buyer_requests, only: [:create, :index] do
    member do
      patch :approve_by_seller
    end
  end

  # ✅ Category routes
  resources :categories, only: [:index, :create]

  # Dashboards
  get :admin_dashboard,  to: "dashboards#admin"
  get :seller_dashboard, to: "dashboards#seller"
  get :buyer_dashboard,  to: "dashboards#buyer"
end
