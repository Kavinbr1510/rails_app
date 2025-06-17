# config/routes.rb

Rails.application.routes.draw do
      post :signup, to: "registrations#create"
      get  :signup, to: 'registrations#new' 
      post :login,  to: "sessions#create"
      delete :logout, to: "sessions#destroy"

      resources :products, only: [ :create, :index, :show ] do
        member do
          patch :approve_by_admin
        end
      end

      resources :buyer_requests, only: [ :create, :index ] do
        member do
          patch :approve_by_seller
        end
      end


      get :admin_dashboard,  to: "dashboards#admin"
      get :seller_dashboard, to: "dashboards#seller"
      get :buyer_dashboard,  to: "dashboards#buyer"
    end
